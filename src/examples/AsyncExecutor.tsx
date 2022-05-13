import { useEffect, useReducer } from "react";
import { of } from "rxjs";
import { delay } from "rxjs/operators";

import { useAsyncExecutor } from "../asyncExecutor/useAsyncExecutor";

export const Comp = () => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const { execute, status } = useAsyncExecutor((w) => {
    return of({}).pipe(delay(3000));
  });

  useEffect(() => {
    execute({});
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
          execute({});
        }}
      >
        EXECUTE
      </button>
      <h1>{status}</h1>
    </>
  );
};
