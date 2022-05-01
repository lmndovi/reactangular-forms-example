import { Button } from "primereact/button";
import { FC, useEffect } from "react";
import {
  FormArray,
  FormControl,
  FormGroup,
  useFormConfig,
  Validators,
  WForm,
  WFormArrayElement,
  WFormControl,
  WFormGroup,
} from "react-angular-forms";
import { WDropDown } from "../TemplateContainer/InputTemplates";
import { TemplateInputContainer } from "../TemplateContainer/TemplateContainer";

const createEventFormGroup = () => {
  const eventFormGroup = new FormGroup({
    arrival_flight_is_international: new FormControl(null, [
      Validators.required,
    ]),
    departure_flight_is_international: new FormControl(null, [
      Validators.required,
    ]),
    crew_change: new FormControl(null, [Validators.required]),
  });

  return eventFormGroup;
};

export const createActivityForm = () => {
  const formGroup = new FormGroup({
    id: new FormControl(),
    order: new FormControl(),
    description: new FormControl(null, [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(12),
    ]),
    category: new FormControl(null, Validators.required),
    job_function_id_list: new FormControl(null, Validators.required),
    job_function_name: new FormControl(null),
    parent_activity: new FormControl(null),
    standard_time: new FormControl(null, Validators.required),
    reference: new FormControl(null, Validators.required),
  });
  formGroup.get("standard_time")!.setValue(0 as any);
  return formGroup;
};

const createMilestoneForm = (numberActivities: number) => {
  const activityForms = [];
  for (let index = 0; index < numberActivities; index++) {
    activityForms.push(createActivityForm());
  }

  const milestoneForm = new FormGroup({
    id: new FormControl(),
    order: new FormControl(),
    description: new FormControl(null, [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(4),
    ]),
    gantt_milestone_activities: new FormArray(
      activityForms,
      Validators.required
    ),
  });
  milestoneForm.get("id")!.setValue(Math.floor(Math.random() * 100).toString());
  return milestoneForm;
};

const createFormGroup = (numberMilestones: number, numberEvents: number) => {
  const milestonesFG: FormGroup[] = [];
  const eventsFG: FormGroup[] = [];

  for (let index = 0; index < numberMilestones; index++) {
    const formGroup = createMilestoneForm(4);
    milestonesFG.push(formGroup);
  }

  for (let index = 0; index < numberEvents; index++) {
    const formGroup = createEventFormGroup();
    eventsFG.push(formGroup);
  }

  const formGroup = new FormGroup({
    airline_id: new FormControl(null, Validators.required),
    itinerary_category: new FormControl(null, Validators.required),
    airport_id_list: new FormControl(null, Validators.required),
    event_list: new FormArray(eventsFG, [Validators.required]),
    gantt_milestone_list: new FormArray(milestonesFG, Validators.required),
  });

  return formGroup;
};

export const AdvancedDynamicArray: FC = () => {
  const formConfig = useFormConfig({
    createForm: () => {
      return createFormGroup(0, 0);
    },
  });

  const { loadSucceed } = formConfig;

  useEffect(() => {
    loadSucceed({});
  }, []);

  return (
    <>
      <WForm formConfig={formConfig}>
        <div className="p-grid">
          <table>
            <thead>
              <tr>
                <th style={{ width: "8%" }}>N</th>
                <th style={{ width: "20%" }}>LLEGADA INTERNACIONAL</th>
                <th style={{ width: "20%" }}>SALIDA INTERNACIONAL</th>
                <th style={{ width: "20%" }}>CAMBIO DE CREW</th>
                <th style={{ width: "12%" }}></th>
              </tr>
            </thead>
            <tbody>
              <WFormArrayElement name="event_list">
                <tr>
                  <td>
                    <div className="inputDropDown" style={{ width: "100%" }}>
                      <WFormControl name="arrival_flight_is_international">
                        <TemplateInputContainer>
                          <WDropDown
                            filter={true}
                            options={[
                              { label: "Doméstico", value: "False" },
                              {
                                label: "Internacional",
                                value: "True",
                              },
                            ]}
                          />
                        </TemplateInputContainer>
                      </WFormControl>
                    </div>
                  </td>
                  <td>
                    <div className="inputDropDown" style={{ width: "100%" }}>
                      <WFormControl name="departure_flight_is_international">
                        <TemplateInputContainer>
                          <WDropDown
                            filter={true}
                            options={[
                              { label: "Doméstico", value: "False" },
                              {
                                label: "Internacional",
                                value: "True",
                              },
                            ]}
                          />
                        </TemplateInputContainer>
                      </WFormControl>
                    </div>
                  </td>

                  <td>
                    <div className="inputDropDown" style={{ width: "100%" }}>
                      <WFormControl name="crew_change">
                        <TemplateInputContainer>
                          <WDropDown
                            filter={true}
                            options={[
                              { label: "Si", value: "True" },
                              {
                                label: "No",
                                value: "False",
                              },
                            ]}
                          />
                        </TemplateInputContainer>
                      </WFormControl>
                    </div>
                  </td>
                  <td>
                    <WFormGroup>
                      {({ control }) => (
                        <Button
                          onClick={() => {
                            const eventsFA = control.parent as FormArray;
                            eventsFA.removeAt(0);
                          }}
                        />
                      )}
                    </WFormGroup>
                  </td>
                </tr>
              </WFormArrayElement>
            </tbody>
          </table>
        </div>

        <div className="p-grid">
          <div className="p-md-2">
            <WFormGroup>
              {({ control }) => {
                const eventsFA = control.get("event_list") as FormArray;
                return (
                  <Button
                    type="button"
                    style={{ color: "#002E6C", width: 200 }}
                    className="p-button-text"
                    icon="pi pi-plus"
                    onClick={() => {
                      const eventFormGroup = createEventFormGroup();
                      eventsFA.push(eventFormGroup);
                    }}
                  >
                    <label className="p-ml-2" style={{ cursor: "pointer" }}>
                      Agregar evento
                    </label>
                  </Button>
                );
              }}
            </WFormGroup>
          </div>
        </div>
      </WForm>
    </>
  );
};
