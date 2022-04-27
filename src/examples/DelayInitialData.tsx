import { FC, useEffect } from "react";
import {
  FormControl,
  FormGroup,
  useFormConfig,
  WControlData,
  WForm,
  WFormControl,
} from "react-angular-forms";
import { delay, of } from "rxjs";
import { WInputText } from "../TemplateContainer/InputTemplates";
import { TemplateInputContainer } from "../TemplateContainer/TemplateContainer";

export const DelayInitialData: FC<any> = () => {
  const formConfig = useFormConfig({
    createForm: (data) => {
      console.log(data);

      const form = new FormGroup({
        nombre: new FormControl(),
        apellido: new FormControl(),
      });

      return form;
    },
    onFormLoaded: (form, data) => {
      console.log("onFormLoaded");
      console.log(data);
      form.patchValue(data);
    },
  });

  const { loadSucceed, loadProcessing } = formConfig;

  useEffect(() => {
    loadProcessing();
    of({ nombre: "Juan", apellido: "perez" })
      .pipe(delay(3000))
      .toPromise()
      .then((data) => {
        loadSucceed(data);
      });
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
