import { useEffect, useReducer } from "react";
import { of } from "rxjs";
import { delay } from "rxjs/operators";

import { useAsyncExecutor } from "../asyncExecutor/useAsyncExecutor";

export const Comp = () => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const { execute, status } = useAsyncExecutor(
    (params) => {
      return of({}).pipe(delay(3000));
    },
    {
      sequential: "EXHAUST",
      params$: of({ q: 3 }),
    }
  );

  useEffect(() => {
    execute({ q: 4 });
  }, [execute]);

  return (
    <>
      <button
        onClick={() => {
          forceUpdate();
        }}
      >
        ForceUpdate
      </button>

      <button
        onClick={() => {
          execute({ q: 4 });
        }}
      >
        EXECUTE
      </button>
      <h1>{status}</h1>
    </>
  );
};
