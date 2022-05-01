import {
  catchError,
  concatMap,
  delay,
  exhaustMap,
  from,
  map,
  mergeMap,
  Observable,
  of,
  shareReplay,
  Subject,
  Subscription,
  switchMap,
  tap,
} from "rxjs";
import hash from "object-hash";
import { ModuleUtils } from "./lang";
type ExecutionStatus =
  | "WAITING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

export class Execution<P, D> {
  status?: ExecutionStatus;
  data?: D;
  error: any;
  private _state$ = new Subject<Execution<P, D>>();

  get state$() {
    const state$ = this._state$
      .asObservable()
      .pipe(shareReplay()) as Observable<Execution<P, D>>;
    return state$;
  }

  constructor(public params: P, public executeFn$?: IRxExecuteFn<P, D>) {}

  wait() {
    this.status = "WAITING";
    this._state$.next(this);
  }

  processing() {
    // if (this.type === "CONCURRENT")
    //   if (this.status !== "WAITING") {
    //     const error = {
    //       code: "IllegalState",
    //     };
    //     throw error;
    //   }
    if (this.status === "PROCESSING") return;
    this.status = "PROCESSING";
    this._state$.next(this);
  }

  succeed(data: D) {
    if (this.status !== "PROCESSING") {
      const error = {
        code: "IllegalState",
      };
      throw error;
    }
    this.data = data;
    this.status = "SUCCESS";
    this._state$.next(this);
  }

  failed(error: any) {
    if (this.status !== "PROCESSING") {
      const error = {
        code: "IllegalState",
      };
      throw error;
    }
    this.error = error;
    this.status = "FAILED";
    this._state$.next(this);
  }

  cancelled() {
    this.status = "CANCELLED";
    this._state$.next(this);
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
  sequential?: "SWITCH" | "EXHAUST";
  concurrent?: {
    type?: "SWITCH" | "EXHAUST" | "MERGE" | "CONCAT";
    detailed?: boolean;
    mergeCapacity: 0;
  };
  params$: Observable<P>;
  cache?: boolean;
  cacheLifetimeime?: number;
  context?: { [key: string]: any };
  onWait?: OnWaitType<P>;
  onProcessing?: OnProcessingType<P>;
  onCancel?: OnCancelType<P>;
  onSuccess?: OnSuccessType<P, D>;
  onError?: OnErrorType<P>;
}

export type IRxExecuteFn<P, D> = (params: P) => D | Promise<D> | Observable<D>;

export class RxExecutor<P, D> {
  private _status?: ExecutionStatus;
  get status() {
    return this._status;
  }

  private _execution$ = new Subject<Execution<P, D>>();

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

  get execution$() {
    return this._execution$.pipe(shareReplay());
  }
  private _internalExecution$ = new Subject<Execution<P, D>>();

  private executionType: "SEQUENTIAL" | "CONCURRENT";
  private operationType: "SWITCH" | "EXHAUST" | "MERGE" | "CONCAT";
  private processorCapacity: number = 1;
  private enableCache: boolean = false;
  private concurrentDetailed: boolean = false;
  // private subscription: Subscription;

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

    // this.subscription = this.init().subscribe();

    this.execute = this.execute.bind(this);
    this.close = this.close.bind(this);
    this.init = this.init.bind(this);
  }
  close() {
    // this.subscription.unsubscribe();
  }

  private cachedData: { [key: string]: D } = {};

  static create<P, D>(
    executeFn$: IRxExecuteFn<P, D>,
    config?: IExecutor<P, D>
  ) {
    console.log("static.create");
    return new RxExecutor<P, D>(executeFn$, config);
  }

  execute(
    params: P,
    config?: {
      executeFn$: IRxExecuteFn<P, D>;

      getExecutionId?: (params: P) => string;
      context?: { [key: string]: any };
      onWait?: OnWaitType<P>;
      onProcessing?: OnProcessingType<P>;
      onCancel?: OnCancelType<P>;
      onSuccess?: OnSuccessType<P, D>;
      onError?: OnErrorType<P>;
    }
  ) {
    /* 1st case:  SEQUENTIAL - EXHAUST */
    console.log(1);

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
    const execution = new Execution<P, D>(params, config && config.executeFn$);

    execution.state$.subscribe((exec) => {
      this._execution$.next(exec);
      if (this.executionType === "SEQUENTIAL") {
        this._status = exec.status;
      }
      if (exec.status === "PROCESSING") {
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
    console.log(2);

    this._internalExecution$.next(execution);

    return execution;
  }

  private processingExecutions: Execution<P, D>[] = [];

  //TODO:
  invalidCache() {}

  init() {
    const asyncOperation = getTypeOperation(this.operationType);
    console.log("started------------------");
    debugger;

    return this._internalExecution$.pipe(
      tap((execution) => {
        console.log(3);
        if (this.executionType === "CONCURRENT") {
          if (this.operationType === "EXHAUST") {
            execution.cancelled();
          } else if (this.operationType === "SWITCH") {
            this.processingExecutions.forEach((execution) => {
              execution.cancelled();
            });
          } else if (this.operationType === "CONCAT") {
            execution.wait();
            if (!this.concurrentDetailed) {
              execution.processing();
            }
          } else if (this.operationType === "MERGE") {
            execution.wait();
            if (
              !this.concurrentDetailed &&
              this.processingExecutions.length === this.processorCapacity
            ) {
              execution.processing();
            }
          }
        }
      }),
      asyncOperation(
        (execution) => {
          console.log(4);

          execution.processing();
          const { params } = execution;
          if (this.enableCache) {
            const key = hash(params);
            const data = this.cachedData[key];
            if (data !== undefined) {
              execution.succeed(data);
              return of(data);
            }
          }
          console.log(5);

          const executeFn$ = execution.executeFn$ || this.executeFn$;

          const data$ = executeFn$
            ? executeFn$(params)
            : of(params).pipe(map((p: any) => p as D));

          const loadData$: Observable<D> = ModuleUtils.isObservable(data$)
            ? data$
            : ModuleUtils.isPromise(data$)
            ? from(data$)
            : of(data$);

          this.processingExecutions.push(execution);
          return loadData$.pipe(
            // return of({}).pipe(
            // delay(3000),
            tap(
              (resp) => {
                const data = resp as D;
                execution.succeed(data);
                this.processingExecutions = this.processingExecutions.filter(
                  (e) => e !== execution
                );
              },
              (error) => {
                console.log(7);

                execution.failed(error);
                this.processingExecutions = this.processingExecutions.filter(
                  (e) => e !== execution
                );
              }
            ),
            catchError((error) => of(error))
          );
        }
        // , this.processorCapacity
      )
    );
  }
}
