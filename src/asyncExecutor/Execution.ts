import {
  concatMap,
  exhaustMap,
  mergeMap,
  Observable,
  shareReplay,
  Subject,
  switchMap,
} from "rxjs";

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

  constructor(
    public id: string,
    public params: P,
    private triggers?: {
      onWaiting?: (params: P) => void;
      onProcessing?: (params: P) => void;
      onSucceed?: (data: D) => void;
    },
    type?: ExecutionType
  ) {
    this.type = type ? type : "SEQUENTIAL";
  }

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

interface IExecutor<P, D> {
  type: ExecutionType;
  concurrentDetails: boolean;
  params$: Observable<P>;
}

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

export class Executor<P, D> {
  //   params$ = new Subject<Execution<P, D>>();

  constructor(private config: IExecutor<P, D>) {}

  execute() {}

  ddd() {
    const asyncOperation = getTypeOperation("SWITCH");

    this.config.params$.pipe();
  }
}
