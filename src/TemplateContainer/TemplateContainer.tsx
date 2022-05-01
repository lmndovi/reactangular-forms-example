import { Message } from "primereact/message";
import { Skeleton } from "primereact/skeleton";
import React, { FC, ReactNode } from "react";
import {
  ControlErrors,
  useControlContext,
  useFormContext,
} from "react-angular-forms";

interface ITemplateInputContainer {
  children?: ReactNode;
  label?: string;
  color?: string;
}

export const TemplateInputContainer: FC<ITemplateInputContainer> = (props) => {
  const { label, children, color } = props;
  const { validationErrors, control, status } = useControlContext();
  const { load } = control;
  return (
    <>
      <div style={{ color: color }}>
        <ControlErrors>
          {(message) => {
            return <Message severity="error" text={message}></Message>;
          }}
        </ControlErrors>
        <div>
          <div>
            <label style={{ color: validationErrors ? "red" : "black" }}>
              {label} -{status} ---SSSS
            </label>
          </div>
          {status === "SUCCESS" ? (
            <div> {children}</div>
          ) : (
            <Skeleton height="40px"></Skeleton>
          )}
        </div>
      </div>
    </>
  );
};
