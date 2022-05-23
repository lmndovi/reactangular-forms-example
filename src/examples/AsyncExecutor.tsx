import { useEffect, useReducer } from "react";
import { of } from "rxjs";
import { delay, switchMap } from "rxjs/operators";

import { useAsyncExecutor2 } from "../asyncExecutor/useAsyncExecutor";

export const Comp = () => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const { execute, status, data, state$ } = useAsyncExecutor2(
    (params) => {
      return of({ params }).pipe(delay(3000));
    },
    {
      sequential: "EXHAUST",
      params$: of({ q: 3 }),
      cache: true,
      onProcessing: () => {},
      onSuccess: (resp) => {},
    }
  );

  useEffect(() => {
    of({}).pipe(switchMap((x) => execute({ q: 3 }).state$));

    execute({ q: 4 });
  }, [execute]);

  return (
    <>
      {JSON.stringify(data, null, 2)}
      <button
        onClick={() => {
          forceUpdate();
        }}
      >
        ForceUpdate
      </button>

      <button
        onClick={() => {
          execute({ q: 5 });
        }}
      >
        EXECUTE
      </button>
      <h1>{status}</h1>
    </>
  );
};
