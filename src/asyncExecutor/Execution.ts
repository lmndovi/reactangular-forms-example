import hash from "object-hash";
import {
  catchError,
  concatMap,
  exhaustMap,
  filter,
  from,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  tap,
  switchAll,
  switchScan,
  share,
  delay,
} from "rxjs";
import { ajax } from "rxjs/ajax";
import { ModuleUtils } from "./lang";
type ExecutionStatus =
  | "WAITING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

interface IExecutionState<P, D> {
  id?: string;
  params: P;
  hashedParams?: string;
  status?: ExecutionStatus;
  data?: D;
  error: any;
}

const generateUniqSerial = () => {
  return "xxxx-xxxx-xxx-xxxx".replace(/[x]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export class Execution<P, D> implements IExecutionState<P, D> {
  id: string;
  status?: ExecutionStatus;
  data?: D;
  error: any;
  hashedParams?: string;
  private _state$ = new Subject<Execution<P, D>>();

  get state$() {
    const state$ = this._state$
      .asObservable()
      .pipe(shareReplay()) as Observable<Execution<P, D>>;
    return state$;
  }

  constructor(
    public params: P,
    public config: {
      executeFn$?: IRxExecuteFn<P, D>;
      cache?: boolean;
      getId?: (params: P) => string;
    }
  ) {
    const conf = config || {
      cache: false,
      getId: (params) => generateUniqSerial(),
    };
    this.hashedParams = conf.cache ? hash(params) : undefined;
    this.id = conf.getId ? conf.getId(params) : generateUniqSerial();
  }

  get state(): IExecutionState<P, D> {
    return this;
  }

  wait() {
    this.status = "WAITING";
    this._state$.next(this);
    return this.state;
  }

  processing() {
    // if (this.status === "PROCESSING") return;
    this.status = "PROCESSING";
    this._state$.next(this);
    return this.state;
  }

  succeed(data: D) {
    this.data = data;
    this.status = "SUCCESS";
    this._state$.next(this);
    return this.state;
  }

  failed(error: any) {
    this.error = error;
    this.status = "FAILED";
    this._state$.next(this);
    return this.state;
  }

  cancelled() {
    this.status = "CANCELLED";
    this._state$.next(this);
    return this.state;
  }

  listen(callback: (execution: Execution<P, D>) => void) {
    this.state$.subscribe(callback);
  }
}

/********************************************************************/

type ProcessingType = "CONCAT" | "EXHAUST" | "MERGE" | "SWITCH";
export const getTypeOperation = (processingType: ProcessingType) => {
  switch (processingType) {
    case "CONCAT":
      return concatMap;
    case "EXHAUST":
      return exhaustMap;
    case "MERGE":
      return mergeMap;
    case "SWITCH":
      return switchMap;
    default:
      return switchMap;
  }
};

type OnWaitType<P> = (params: P, context?: { [key: string]: any }) => void;
type OnProcessingType<P> = (
  params: P,
  context?: { [key: string]: any }
) => void;
type OnCancelType<P> = (params: P, context?: { [key: string]: any }) => void;
type OnSuccessType<P, D> = (
  data: D,
  params: P,
  context?: { [key: string]: any }
) => void;
type OnErrorType<P> = (
  error: any,
  params: P,
  context?: { [key: string]: any }
) => void;

export interface IExecutor<P, D> {
  enabledRetry?: boolean;
  sequential?: "SWITCH" | "EXHAUST";
  concurrent?: {
    type?: "SWITCH" | "EXHAUST" | "MERGE" | "CONCAT";
    detailed?: boolean;
    mergeCapacity: 0;
  };
  params$?: Observable<P>;
  cache?: boolean;
  cacheLifetimeime?: number;
  context?: { [key: string]: any };
  onWait?: OnWaitType<P>;
  onProcessing?: OnProcessingType<P>;
  onCancel?: OnCancelType<P>;
  onSuccess?: OnSuccessType<P, D>;
  onError?: OnErrorType<P>;
  getId?: (params: P) => string;
}

export type IRxExecuteFn<P, D> = (params: P) => D | Promise<D> | Observable<D>;

export class RxExecutor<P, D> {
  private _status?: ExecutionStatus;
  get status() {
    return this._status;
  }

  get isProcessing() {
    return this.status === "PROCESSING";
  }

  get isSuccess() {
    return this.status === "SUCCESS";
  }

  get isError() {
    return this.status === "FAILED";
  }

  retry(executionId?: string) {}

  private _internalExecution$ = new Subject<Execution<P, D>>();

  private executionType: "SEQUENTIAL" | "CONCURRENT";
  private operationType: "SWITCH" | "EXHAUST" | "MERGE" | "CONCAT";
  private processorCapacity: number = 1;
  private enableCache: boolean = false;
  private concurrentDetailed: boolean = false;

  constructor(
    private executeFn$: IRxExecuteFn<P, D>,
    private config?: IExecutor<P, D>
  ) {
    this.executionType = config
      ? config.concurrent
        ? "CONCURRENT"
        : "SEQUENTIAL"
      : "SEQUENTIAL";

    const tempConfig = this.config || {
      sequential: "SWITCH",
      concurrent: { type: "SWITCH", mergeCapacity: 1, detailed: true },
      cache: false,
    };
    this.concurrentDetailed = !!tempConfig.concurrent?.detailed;
    const { concurrent, sequential } = tempConfig;
    this.operationType =
      sequential || (concurrent && concurrent.type) || "SWITCH";

    if (
      this.operationType === "MERGE" &&
      tempConfig.concurrent!.mergeCapacity > 1
    ) {
      this.processorCapacity = tempConfig.concurrent!.mergeCapacity;
    }

    this.enableCache = !!tempConfig.cache;
    this.execute = this.execute.bind(this);
    this.close = this.close.bind(this);
    // this.state$ = this.state$.bind(this);
  }
  close() {
    // this.subscription.unsubscribe();
  }

  private cachedData: { [key: string]: D } = {};

  static create<P, D>(
    executeFn$: IRxExecuteFn<P, D>,
    config?: IExecutor<P, D>
  ) {
    return new RxExecutor<P, D>(executeFn$, config);
  }

  execute(
    params: P,
    config?: {
      executeFn$: IRxExecuteFn<P, D>;

      getId?: (params: P) => string;
      context?: { [key: string]: any };
      onWait?: OnWaitType<P>;
      onProcessing?: OnProcessingType<P>;
      onCancel?: OnCancelType<P>;
      onSuccess?: OnSuccessType<P, D>;
      onError?: OnErrorType<P>;
    }
  ) {
    /* 1st case:  SEQUENTIAL - EXHAUST */
    /*---- Effective Context -----------*/
    const context = (config ? config.context : {}) || {};
    const mergedContext = {
      ...((this.config && this.config.context) || {}),
      ...context,
    };

    if (
      this.executionType === "SEQUENTIAL" &&
      this.operationType === "EXHAUST"
    ) {
      const currentxecution = this.processingExecutions[0];
      if (currentxecution) {
        return currentxecution;
      }
    }
    /************************************************++ */
    const execution = new Execution<P, D>(params, {
      executeFn$: config?.executeFn$,
      cache: this.config?.cache,
      getId: this.config?.getId,
    });

    execution.state$.subscribe((exec) => {
      if (this.executionType === "SEQUENTIAL") {
        if (this.operationType === "EXHAUST" || this.operationType === "SWITCH")
          this._status = exec.status;
      }
      if (exec.status === "PROCESSING") {
        console.log("", exec.status);

        config &&
          config.onProcessing &&
          config.onProcessing(exec.params, mergedContext);

        this.config &&
          this.config.onProcessing &&
          this.config.onProcessing(exec.params, mergedContext);
      }
      if (exec.status === "SUCCESS") {
        config &&
          config.onSuccess &&
          config.onSuccess(exec.data!, exec.params, mergedContext);

        this.config &&
          this.config.onSuccess &&
          this.config.onSuccess(exec.data!, exec.params, mergedContext);
      }
      if (exec.status === "FAILED") {
        config &&
          config.onError &&
          config.onError(exec.error, exec.params, mergedContext);

        this.config &&
          this.config.onError &&
          this.config.onError(exec.error, exec.params, mergedContext);
      }
      if (exec.status === "WAITING") {
        config && config.onWait && config.onWait(exec.params, mergedContext);

        this.config &&
          this.config.onWait &&
          this.config.onWait(exec.params, mergedContext);
      }
      if (exec.status === "CANCELLED") {
        config &&
          config.onCancel &&
          config.onCancel(exec.params, mergedContext);

        this.config &&
          this.config.onCancel &&
          this.config.onCancel(exec.params, mergedContext);
      }
    });
    this._internalExecution$.next(execution);
    return execution;
  }

  private processingExecutions: Execution<P, D>[] = [];
  private failedExecutions: Execution<P, D>[] = [];

  //TODO:
  invalidCache() {}

  isFull(): boolean {
    return this.processingExecutions.length >= this.processorCapacity;
  }

  //

  get state$() {
    const asyncOperation = getTypeOperation(this.operationType);
    const waitingSubject = new Subject<Execution<P, D>>();
    return merge(
      waitingSubject.pipe(
        filter(() => {
          return (
            this.operationType === "SWITCH" &&
            this.executionType === "CONCURRENT"
          );
        }),
        map((execution) => {
          execution.wait();
          return execution.state;
        })
      ),
      this._internalExecution$.pipe(
        tap((execution) => {
          waitingSubject.next(execution);
        }),
        asyncOperation((execution) => {
          const { params } = execution;
          if (this.enableCache) {
            const key = hash(params);
            const data = this.cachedData[key];
            if (data !== undefined) {
              execution.succeed(data);
              return of(execution);
            }
          }
          const executeFn$ = execution.config?.executeFn$ || this.executeFn$;
          const data$ = executeFn$
            ? executeFn$(params)
            : of(params).pipe(map((p: any) => p as D));

          const loadData$: Observable<D> = ModuleUtils.isObservable(data$)
            ? data$
            : ModuleUtils.isPromise(data$)
            ? from(data$)
            : of(data$);

          return merge(
            of(execution).pipe(
              filter(() => {
                return (
                  this.operationType === "SWITCH" &&
                  this.executionType === "CONCURRENT" &&
                  this.isFull()
                );
              }),
              map(() => {
                const execution = this.processingExecutions[0];
                execution.cancelled();
                return execution.state;
              })
            ),
            of(execution).pipe(
              filter(() => {
                return (
                  this.operationType !== "SWITCH" ||
                  this.executionType !== "SEQUENTIAL" ||
                  !this.isFull()
                );
              }),
              tap((execution) => {
                this.processingExecutions.push(execution);
              }),
              map((execution) => {
                execution.processing();
                // alert("processing");
                return execution.state;
              })
            ),
            loadData$.pipe(
              map((resp) => {
                execution.succeed(resp);
                return execution.state;
              }),
              tap(
                (execution) => {
                  console.log("init", this.processingExecutions.length);

                  this.processingExecutions = this.processingExecutions.filter(
                    (e) => e !== execution
                  );
                  console.log(
                    `this.processingExecutions`,
                    this.processingExecutions.length
                  );
                },
                () => {
                  //TODO
                }
              ),
              catchError((error) => {
                execution.failed(error);
                return of(execution.state);
              })
            )
          ).pipe(
            tap((x) => {
              console.log(`ccd.tap ${x.status}`);
            })
          );
        })
      )
    ).pipe(shareReplay());
  }
}
