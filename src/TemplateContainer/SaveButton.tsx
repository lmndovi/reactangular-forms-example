import { FC, ReactNode } from "react";
import { Button, ButtonProps } from "primereact/button";
import { useFormContext } from "react-angular-forms";

export const SaveButton: FC<ButtonProps> = (props) => {
  const { formSaveStatus, formLoadStatus } = useFormContext();

  return (
    <>
      {formLoadStatus === "SUCCESS" && (
        <Button
          type="submit"
          disabled={formSaveStatus === "PROCESSING"}
          {...props}
        ></Button>
      )}
    </>
  );
};
