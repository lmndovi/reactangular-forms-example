import {
  catchError,
  concatMap,
  exhaustMap,
  from,
  map,
  mergeMap,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import hash from "object-hash";
import { ModuleUtils } from "./lang";
type ExecutionType = "CONCURRENT" | "SEQUENTIAL";
type ExecutionStatus =
  | "WAITING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCEL";

type Phase = "";

export class Execution<P, D> {
  type: ExecutionType = "SEQUENTIAL";
  hashedParams: string = "";
  status?: ExecutionStatus;
  data?: D;
  context: { [key: string]: any } = {};
  error: any;
  //   private _state$= new Subject<{id:string, hashedParams:string, params:P,data:D, status:}>();
  private _state$ = new Subject<Execution<P, D>>();

  get state$() {
    const state$ = this._state$
      .asObservable()
      .pipe(shareReplay()) as Observable<Execution<P, D>>;
    return state$;
  }

  constructor(public params: P) {}

  wait() {
    if (this.type != "CONCURRENT") {
      const error = {
        code: "IllegalState",
      };
      throw error;
    }
    this.status = "WAITING";
    this._state$.next(this);
  }

  processing() {
    if (this.type === "CONCURRENT")
      if (this.status !== "WAITING") {
        const error = {
          code: "IllegalState",
        };
        throw error;
      }

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

  cancelled() {}

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

export interface IExecutor<P, D> {
  sequential?: "SWITCH" | "EXHAUST";
  concurrent?: {
    type?: "SWITCH" | "EXHAUST" | "MERGE" | "CONCAT";
    detailed?: boolean;
    mergeCapacity: 0;
  };
  params$: Observable<P>;
  cache?: {
    timeToLive: number;
  };
  context?: { [key: string]: any };

  onWait?: (params: P, context?: { [key: string]: any }) => void;
  onProcessing?: (params: P, context?: { [key: string]: any }) => void;
  onCancel?: (params: P, context?: { [key: string]: any }) => void;
  onSuccess?: (data: D, params: P, context?: { [key: string]: any }) => void;
  onError?: (error: any, params: P, context?: { [key: string]: any }) => void;
}

export type IRxExecuteFn<P, D> = (params: P) => D | Promise<D> | Observable<D>;

export class RxExecutor<P, D> {
  private _execution$ = new Subject<Execution<P, D>>();

  get execution$() {
    return this._execution$.pipe(shareReplay());
  }
  private _internalExecution$ = new Subject<Execution<P, D>>();

  constructor(
    private executeFn$: IRxExecuteFn<P, D>,
    private config?: IExecutor<P, D>
  ) {
    this.init();
  }

  private cache: { [key: string]: Execution<P, D> } = {};

  static create<P, D>(
    executeFn$: IRxExecuteFn<P, D>,
    config?: IExecutor<P, D>
  ) {
    return new RxExecutor<P, D>(executeFn$, config);
  }

  execute(params: P, context?: { [key: string]: any }) {
    /************************************************************** */
    const config = this.config || { sequential: "SWITCH", cache: false };
    const { sequential } = config;
    if (sequential) {
      if (sequential === "EXHAUST") {
        const execution = this.processingExecutions[0];
        if (execution) {
          return execution;
        }
      }
    }
    /************************************************++ */
    let data: D;
    let isCached: boolean = false;

    const execution = new Execution<P, D>(params);

    if (config.cache) {
      const key = hash(params);
      const cachedExecution = this.cache[key];
      isCached = !!cachedExecution;
      data = cachedExecution && cachedExecution.data!;
      if (!isCached) this.cache[key] = execution;
    }

    execution.state$.subscribe((exec) => {
      this._execution$.next(exec);
      if (exec.status === "PROCESSING") {
        this.config &&
          this.config.onProcessing &&
          this.config.onProcessing(
            exec.params,
            this.config && this.config.context
          );
      }
      if (exec.status === "SUCCESS") {
        this.config &&
          this.config.onSuccess &&
          this.config.onSuccess(
            exec.data!,
            exec.params,
            this.config && this.config.context
          );
      }
      if (exec.status === "FAILED") {
        this.config &&
          this.config.onError &&
          this.config.onError(
            exec.error,
            exec.params,
            this.config && this.config.context
          );
      }
      if (exec.status === "WAITING") {
        this.config &&
          this.config.onWait &&
          this.config.onWait(exec.params, this.config && this.config.context);
      }
      if (exec.status === "CANCEL") {
        this.config &&
          this.config.onCancel &&
          this.config.onCancel(exec.params, this.config && this.config.context);
      }
    });
    if (!isCached) {
      this._internalExecution$.next(execution);
    } else {
      execution.succeed(data!);
    }
    return execution;
  }

  private processingExecutions: Execution<P, D>[] = [];

  private init() {
    this.ddd().subscribe();
  }

  private ddd() {
    const config = this.config || {
      sequential: "SWITCH",
      concurrent: { type: "SWITCH", mergeCapacity: 1, detailed: true },
    };

    const { concurrent, sequential } = config;
    const typeOperation =
      sequential || (concurrent && concurrent.type) || "SWITCH";

    const asyncOperation = getTypeOperation(typeOperation);

    const executorCapacity =
      typeOperation === "MERGE"
        ? concurrent!.mergeCapacity || Number.MAX_SAFE_INTEGER
        : 1;

    return this._internalExecution$.pipe(
      tap((execution) => {
        execution.wait();
        const { concurrent } = config;
        if (concurrent) {
          const concurrentType = concurrent.type || "SWITCH";
          const detailed = concurrent.detailed;
          if (concurrentType === "EXHAUST") {
            execution.cancelled();
          } else if (concurrentType === "SWITCH") {
            this.processingExecutions.forEach((execution) => {
              execution.cancelled();
            });
          } else if (concurrentType === "CONCAT") {
            if (!detailed) {
              execution.processing();
            }
          } else if (concurrentType === "MERGE") {
            if (
              !detailed &&
              this.processingExecutions.length === executorCapacity
            ) {
              execution.processing();
            }
          }
        }
      }),
      asyncOperation((execution) => {
        //TODO: Exclude. Avoid to processing execute twice

        execution.processing();
        const data$ = this.executeFn$
          ? this.executeFn$(execution.params)
          : of(execution.params).pipe(map((p: any) => p as D));

        const loadData$: Observable<D> = ModuleUtils.isObservable(data$)
          ? data$
          : ModuleUtils.isPromise(data$)
          ? from(data$)
          : of(data$);

        this.processingExecutions.push(execution);
        return loadData$.pipe(
          tap(
            (resp) => {
              const data = resp as D;
              execution.succeed(data);
              this.processingExecutions = this.processingExecutions.filter(
                (e) => e !== execution
              );
            },
            (error) => {
              execution.failed(error);
              this.processingExecutions = this.processingExecutions.filter(
                (e) => e !== execution
              );
            }
          ),
          catchError((error) => of(error))
        );
      }, executorCapacity)
    );
  }
}
