import { createHashRouter } from "react-router";
import { Layout } from "./components/layout";
import { HomePage } from "./components/pages/home-page";
import { WorkflowsOverview } from "./components/pages/workflows-overview";
import { WorkflowsPage } from "./components/pages/workflows-page";
import { SkillsPage } from "./components/pages/skills-page";
import { NotesPage } from "./components/pages/notes-page";
import { ContextPage } from "./components/pages/context-page";
import { SkillBuilderPage } from "./components/pages/skill-builder-page";

export const router = createHashRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "context", Component: ContextPage },
      { path: "workflows", Component: WorkflowsOverview },
      { path: "workflows/:id", Component: WorkflowsPage },
      { path: "skills", Component: SkillsPage },
      { path: "skills/builder", Component: SkillBuilderPage },
      { path: "notes", Component: NotesPage },
      { path: "*", Component: HomePage },
    ],
  },
]);