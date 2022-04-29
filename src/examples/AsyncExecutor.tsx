import { of } from "rxjs";
import { useAsyncExecutor } from "../asyncExecutor/useAsyncExecutor";

export const Comp = () => {
  const { execute } = useAsyncExecutor(() => {
    return of({});
  });

  return <></>;
};
