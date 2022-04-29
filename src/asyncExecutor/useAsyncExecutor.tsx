import { useRef } from "react";
import { IExecutor, IRxExecuteFn, RxExecutor } from "./Execution";

export const useAsyncExecutor = <P = any, D = any>(
  executeFn$: IRxExecuteFn<P, D>,
  config?: IExecutor<P, D>
) => {
  return useRef(RxExecutor.create(executeFn$, config)).current;
};
