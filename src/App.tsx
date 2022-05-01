import React from "react";
import "./App.css";
import { AdvancedDynamicArray } from "./examples/AdvancedDynamicArray";
import { Comp } from "./examples/AsyncExecutor";
import { BasicForm } from "./examples/BasicForm";
import { DelayInitialData } from "./examples/DelayInitialData";
import { SaveData } from "./examples/SaveData";

function App() {
  // return <BasicForm></BasicForm>;

  // return <DelayInitialData></DelayInitialData>;

  // return <SaveData></SaveData>;
  // return <AdvancedDynamicArray></AdvancedDynamicArray>;
  return <Comp></Comp>;
}

export default App;
