import { FC, useEffect } from "react";
import {
  FormControl,
  FormGroup,
  useFormConfig,
  WControlData,
  WForm,
  WFormControl,
} from "react-angular-forms";
import { WInputText } from "../TemplateContainer/InputTemplates";
import { TemplateInputContainer } from "../TemplateContainer/TemplateContainer";

export const BasicForm: FC<any> = () => {
  const formConfig = useFormConfig({
    createForm: () => {
      const form = new FormGroup({
        nombre: new FormControl(),
        apellido: new FormControl(),
      });

      return form;
    },
  });

  const { loadSucceed } = formConfig;

  useEffect(() => {
    loadSucceed({});
  }, []);

  return (
    <>
      <WForm formConfig={formConfig}>
        <WControlData />
        <div className="p-grid">
          <div className="p-md-2">
            <WFormControl name="nombre">
              <TemplateInputContainer label="Nombre">
                <WInputText />
              </TemplateInputContainer>
            </WFormControl>
          </div>
          <div className="p-md-2">
            <WFormControl name="apellido">
              <TemplateInputContainer label="Apellido">
                <WInputText />
              </TemplateInputContainer>
            </WFormControl>
          </div>
        </div>
      </WForm>
    </>
  );
};
