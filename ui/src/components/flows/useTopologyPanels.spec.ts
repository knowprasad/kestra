import {describe, it, expect, vi, beforeEach} from "vitest"
import {ref, type Ref, defineComponent, h, inject, nextTick} from "vue"
import {mount} from "@vue/test-utils"
import type {Panel} from "../../utils/multiPanelTypes"
import {TOPOLOGY_CLICK_INJECTION_KEY} from "../no-code/injectionKeys"
import type {TopologyClickParams} from "../no-code/utils/types"
import {NOCODE_PREFIX} from "./useNoCodePanels"

// --- Store mocks ---
let flowYaml: string | undefined = undefined
let flowSchema: {$ref?: string} | undefined = undefined

vi.mock("../../stores/flow", () => ({
    useFlowStore: () => ({
        get flowYaml() {
            return flowYaml
        },
    }),
}))

vi.mock("../../stores/plugins", () => ({
    usePluginsStore: () => ({
        get flowSchema() {
            return flowSchema
        },
    }),
}))

import {useTopologyPanels} from "./useTopologyPanels"

const sampleFlowYaml = `id: test-flow
namespace: test.ns
tasks:
  - id: task1
    type: io.kestra.plugin.core.log.Log
    message: first
  - id: task2
    type: io.kestra.plugin.core.log.Log
    message: second
  - dependency: task1
    task:
      id: dag_task
      type: io.kestra.plugin.core.log.Log
      message: dag
`

function setupTopologyPanels(initialPanels: Panel[] = []) {
    const panels = ref<Panel[]>(initialPanels)
    const openAddTaskTab = vi.fn()
    const openEditTaskTab = vi.fn()
    let injectedClickRef!: Ref<TopologyClickParams | undefined>

    const Consumer = defineComponent({
        setup() {
            injectedClickRef = inject(TOPOLOGY_CLICK_INJECTION_KEY)!
            return () => h("div")
        },
    })

    const Provider = defineComponent({
        setup() {
            useTopologyPanels(panels, openAddTaskTab, openEditTaskTab)
            return () => h(Consumer)
        },
    })

    const wrapper = mount(Provider)

    return {
        panels,
        openAddTaskTab,
        openEditTaskTab,
        get clickRef() {
            return injectedClickRef
        },
        async trigger(params: TopologyClickParams) {
            injectedClickRef.value = params
            await nextTick()
        },
        wrapper,
    }
}

describe("useTopologyPanels", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        flowYaml = sampleFlowYaml
        flowSchema = {$ref: "#/definitions/flow"}
    })

    it("opens add-task tab on create click with parent path and index stripped off the end", async () => {
        const panels: Panel[] = [
            {size: 100, tabs: [{uid: "topology"}], activeTab: {uid: "topology"}},
        ]
        const {openAddTaskTab, trigger} = setupTopologyPanels(panels)

        await trigger({
            action: "create",
            params: {
                id: "task2",
                section: "tasks",
                position: "after",
            },
        })

        expect(openAddTaskTab).toHaveBeenCalledTimes(1)
        expect(openAddTaskTab).toHaveBeenCalledWith(
            {panelIndex: -1, tabIndex: -1},
            "tasks",
            "#/definitions/flow/properties/tasks/items",
            1,
            "after",
            undefined,
            1,
        )
    })

    it("strips field name as well as index on create click for a named field", async () => {
        const panels: Panel[] = [
            {size: 100, tabs: [{uid: "topology"}], activeTab: {uid: "topology"}},
        ]
        const {openAddTaskTab, trigger} = setupTopologyPanels(panels)

        await trigger({
            action: "create",
            params: {
                id: "dag_task",
                section: "tasks",
                position: "before",
            },
        })

        expect(openAddTaskTab).toHaveBeenCalledTimes(1)
        expect(openAddTaskTab).toHaveBeenCalledWith(
            {panelIndex: -1, tabIndex: -1},
            "tasks",
            "#/definitions/flow/properties/tasks/items",
            2,
            "before",
            "task",
            1,
        )
    })

    it("opens edit tab with parent path and index when field name is undefined", async () => {
        const panels: Panel[] = [
            {size: 100, tabs: [{uid: "topology"}], activeTab: {uid: "topology"}},
        ]
        const {openEditTaskTab, trigger} = setupTopologyPanels(panels)

        await trigger({
            action: "edit",
            params: {
                id: "task2",
                section: "tasks",
            },
        })

        expect(openEditTaskTab).toHaveBeenCalledTimes(1)
        expect(openEditTaskTab).toHaveBeenCalledWith(
            {panelIndex: -1, tabIndex: -1},
            "tasks",
            "#/definitions/flow/properties/tasks/items",
            1,
            1,
        )
    })

    it("passes full path and no index on edit click when field name is defined", async () => {
        const panels: Panel[] = [
            {size: 100, tabs: [{uid: "topology"}], activeTab: {uid: "topology"}},
        ]
        const {openEditTaskTab, trigger} = setupTopologyPanels(panels)

        await trigger({
            action: "edit",
            params: {
                id: "dag_task",
                section: "tasks",
            },
        })

        expect(openEditTaskTab).toHaveBeenCalledTimes(1)
        expect(openEditTaskTab).toHaveBeenCalledWith(
            {panelIndex: -1, tabIndex: -1},
            "tasks[2].task",
            "#/definitions/flow/properties/tasks/items",
            undefined,
            1,
        )
    })

    it("builds the block schema path from flow schema $ref, section, and items", async () => {
        flowSchema = {$ref: "https://kestra.io/schemas/custom-flow.json"}
        const panels: Panel[] = [
            {size: 100, tabs: [{uid: "topology"}], activeTab: {uid: "topology"}},
        ]
        const {openEditTaskTab, trigger} = setupTopologyPanels(panels)

        await trigger({
            action: "edit",
            params: {
                id: "task1",
                section: "tasks",
            },
        })

        expect(openEditTaskTab).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            "https://kestra.io/schemas/custom-flow.json/properties/tasks/items",
            expect.anything(),
            expect.anything(),
        )
    })

    it("ignores click when path resolves to nothing (missing section in source)", async () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
        const panels: Panel[] = [
            {size: 100, tabs: [{uid: "topology"}], activeTab: {uid: "topology"}},
        ]
        const {openAddTaskTab, openEditTaskTab, trigger} = setupTopologyPanels(panels)

        // section 'triggers' does not exist in sampleFlowYaml -> getPathFromSectionAndId returns undefined
        await trigger({
            action: "create",
            params: {
                id: "trigger1",
                section: "triggers",
                position: "after",
            },
        })

        expect(openAddTaskTab).not.toHaveBeenCalled()
        expect(openEditTaskTab).not.toHaveBeenCalled()
        expect(warnSpy).not.toHaveBeenCalled()
    })

    it("ignores click and warns when path carries no index", async () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
        const panels: Panel[] = [
            {size: 100, tabs: [{uid: "topology"}], activeTab: {uid: "topology"}},
        ]
        const {openAddTaskTab, openEditTaskTab, trigger} = setupTopologyPanels(panels)

        // Non-existent task in existing 'tasks' section resolves to 'tasks' without an index
        await trigger({
            action: "create",
            params: {
                id: "non-existent-task",
                section: "tasks",
                position: "after",
            },
        })

        expect(openAddTaskTab).not.toHaveBeenCalled()
        expect(openEditTaskTab).not.toHaveBeenCalled()
        expect(warnSpy).toHaveBeenCalledWith(
            "No refPath found in topology click params",
            expect.objectContaining({action: "create"}),
        )
    })

    it("uses new panel index when no no-code tab is open, and reuses existing panel index otherwise", async () => {
        // Scenario A: No no-code tab open -> newPanelIndex is topology panelIndex + 1
        const panelsWithoutNoCode: Panel[] = [
            {size: 100, tabs: [{uid: "topology"}], activeTab: {uid: "topology"}},
        ]
        const {openEditTaskTab: editA, trigger: triggerA} = setupTopologyPanels(panelsWithoutNoCode)

        await triggerA({
            action: "edit",
            params: {id: "task1", section: "tasks"},
        })

        expect(editA).toHaveBeenCalledWith(
            {panelIndex: -1, tabIndex: -1},
            "tasks",
            "#/definitions/flow/properties/tasks/items",
            0,
            1, // newPanelIndex = 0 + 1
        )

        // Scenario B: No-code tab open -> newPanelIndex is undefined, existing target is passed
        const panelsWithNoCode: Panel[] = [
            {size: 50, tabs: [{uid: "topology"}], activeTab: {uid: "topology"}},
            {size: 50, tabs: [{uid: `${NOCODE_PREFIX}-edit-task`}], activeTab: {uid: `${NOCODE_PREFIX}-edit-task`}},
        ]
        const {openEditTaskTab: editB, trigger: triggerB} = setupTopologyPanels(panelsWithNoCode)

        await triggerB({
            action: "edit",
            params: {id: "task1", section: "tasks"},
        })

        expect(editB).toHaveBeenCalledWith(
            {panelIndex: 1, tabIndex: 0},
            "tasks",
            "#/definitions/flow/properties/tasks/items",
            0,
            undefined, // newPanelIndex is undefined
        )
    })

    it("clears the click ref after handling", async () => {
        const panels: Panel[] = [
            {size: 100, tabs: [{uid: "topology"}], activeTab: {uid: "topology"}},
        ]
        const {clickRef, trigger} = setupTopologyPanels(panels)

        expect(clickRef.value).toBeUndefined()

        await trigger({
            action: "edit",
            params: {id: "task1", section: "tasks"},
        })

        expect(clickRef.value).toBeUndefined()
    })
})
