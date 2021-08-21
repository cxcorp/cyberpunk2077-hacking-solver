import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import FilteredTextArea from "./FilteredTextArea";

test("renders", async () => {
  render(
    <FilteredTextArea validate={() => undefined} onChange={() => undefined} />
  );
});

test("accepts user input", async () => {
  render(
    <FilteredTextArea validate={() => undefined} onChange={() => undefined} />
  );
  const foo = screen.getByTestId("foo");

  expect(foo).toHaveValue("");

  userEvent.type(foo, "C");

  expect(foo).toHaveValue("C");
});

test("adds spaces automatically", async () => {
  render(
    <FilteredTextArea validate={() => undefined} onChange={() => undefined} />
  );
  const foo = screen.getByTestId("foo");
  userEvent.type(foo, "7A55");
  expect(foo).toHaveValue("7A 55");
});

test("adds newlines automatically", async () => {
  render(
    <FilteredTextArea validate={() => undefined} onChange={() => undefined} />
  );
  const foo = screen.getByTestId("foo");
  userEvent.type(foo, "7A55E9E91C5555");
  expect(foo).toHaveValue(`7A 55 E9 E9 1C 55
55`);
});
