import { useEffect, useReducer, useRef } from "react";
import { IExecutor, IRxExecuteFn, RxExecutor } from "./Execution";

export const useAsyncExecutor = <P = any, D = any>(
  executeFn$: IRxExecuteFn<P, D>,
  config?: IExecutor<P, D>
) => {
  const asyncExecutor = useRef(RxExecutor.create(executeFn$, config)).current;

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    console.log("SOLO 1 VEZ!!!!!!!!!!1");
    const subscription = asyncExecutor.execution$.subscribe((x) => {
      console.log("execution$.subscribe");
      forceUpdate();
    });
    return () => {
      asyncExecutor.close();
      subscription.unsubscribe();
    };
  }, [asyncExecutor.execution$.subscribe]);

  return asyncExecutor;
};
