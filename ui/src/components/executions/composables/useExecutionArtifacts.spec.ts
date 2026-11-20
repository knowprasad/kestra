import {describe, expect, it, vi} from "vitest"
import {ref} from "vue"

const executionsStore = vi.hoisted(() => ({flow: null as unknown, execution: null as unknown}))
const flowStore = vi.hoisted(() => ({loadFlow: vi.fn()}))
const federated = vi.hoisted(() => ({
    resolveRemoteComponent: vi.fn(),
    taskAdditionalInfoRemote: {value: {} as Record<string, {title?: string}>},
}))

vi.mock("../../../stores/executions", () => ({useExecutionsStore: () => executionsStore}))
vi.mock("../../../stores/flow", () => ({useFlowStore: () => flowStore}))
vi.mock("../../../remoteComponents/useFederatedModule", () => ({
    useFederatedModule: () => ({
        RemoteComponent: undefined,
        taskAdditionalInfoRemote: federated.taskAdditionalInfoRemote,
        manifestReady: ref(true),
        hasResolvedComponent: () => true,
        hasFailedComponent: () => false,
        resolveRemoteComponent: federated.resolveRemoteComponent,
        subtitleResolvers: {},
    }),
}))

import {useExecutionArtifacts} from "./useExecutionArtifacts"

const flush = () => new Promise((resolve) => setTimeout(resolve))

const SHELL = "io.kestra.plugin.scripts.shell.Commands"
const RUNNER = "io.kestra.plugin.ee.aws.runner.Batch"
const ERROR_TASK = "io.kestra.plugin.core.log.Log"
const FINALLY_TASK = "io.kestra.plugin.scripts.python.Commands"
const AFTER_TASK = "io.kestra.plugin.core.execution.PurgeExecution"

const sourceOf = (runner?: string) => `id: f
namespace: ns
tasks:
  - id: shell
    type: ${SHELL}
${runner ? `    taskRunner:\n      type: ${runner}\n` : ""}`

const allSectionsSource = `id: f
namespace: ns
tasks:
  - id: shell
    type: ${SHELL}
errors:
  - id: errorTask
    type: ${ERROR_TASK}
finally:
  - id: finallyTask
    type: ${FINALLY_TASK}
    taskRunner:
      type: ${RUNNER}
afterExecution:
  - id: afterTask
    type: ${AFTER_TASK}`

const strippedFlow = {id: "f", namespace: "ns", tasks: [{id: "shell", type: SHELL}]}
const allSectionsFlow = {
    id: "f",
    namespace: "ns",
    tasks: [{id: "shell", type: SHELL}],
    errors: [{id: "errorTask", type: ERROR_TASK}],
    finally: [{id: "finallyTask", type: FINALLY_TASK, taskRunner: {type: RUNNER}}],
    afterExecution: [{id: "afterTask", type: AFTER_TASK}],
}
const execution = {id: "e", flowId: "f", namespace: "ns", flowRevision: 3}

const givenSource = (source: string, flowOverride?: Record<string, unknown>) => {
    executionsStore.flow = flowOverride ?? strippedFlow
    executionsStore.execution = execution
    flowStore.loadFlow.mockResolvedValue({source})
}

describe("useExecutionArtifacts", () => {
    it("shouldListArtifactsOfTheTaskRunnerAndOfTheTask", async () => {
        // Given
        givenSource(sourceOf(RUNNER))
        federated.taskAdditionalInfoRemote.value = {
            [`${SHELL}/logs`]: {},
            [`${RUNNER}/details`]: {title: "Runner details"},
        }

        // When
        const {artifacts} = useExecutionArtifacts()
        await flush()

        // Then
        expect(artifacts.value).toEqual([
            {key: `shell:${SHELL}/logs`, taskId: "shell", taskType: `${SHELL}/logs`, cls: SHELL, title: "logs", description: undefined},
            {key: `shell:${RUNNER}/details`, taskId: "shell", taskType: `${RUNNER}/details`, cls: SHELL, title: "Runner details", description: undefined},
        ])
    })

    it("shouldResolveTheTaskRunnerTypeAlongsideTheTaskType", async () => {
        // Given
        federated.resolveRemoteComponent.mockClear()
        givenSource(sourceOf(RUNNER))

        // When
        useExecutionArtifacts()
        await flush()

        // Then
        expect(federated.resolveRemoteComponent).toHaveBeenCalledWith([RUNNER, SHELL].map((cls) => ({cls, version: undefined})))
    })

    it("shouldNotListTheRunnerArtifactsOfAnotherTask", async () => {
        // Given
        givenSource(sourceOf())
        federated.taskAdditionalInfoRemote.value = {[`${RUNNER}/details`]: {}}

        // When
        const {artifacts} = useExecutionArtifacts()
        await flush()

        // Then
        expect(artifacts.value).toEqual([])
    })

    it("shouldLoadTheExecutedRevisionWhenNoFlowIsInTheStore", async () => {
        // Given
        givenSource(sourceOf(RUNNER))
        federated.taskAdditionalInfoRemote.value = {[`${RUNNER}/details`]: {}}

        // When
        const {artifacts} = useExecutionArtifacts()
        await flush()

        // Then
        expect(flowStore.loadFlow).toHaveBeenCalledWith({namespace: "ns", id: "f", revision: "3", store: false, optional: true})
        expect(artifacts.value).toHaveLength(1)
    })

    it("shouldIncludeTasksFromErrorsFinallyAndAfterExecutionSections", async () => {
        // Given
        givenSource(allSectionsSource, allSectionsFlow)

        // When
        const {tasks} = useExecutionArtifacts()
        await flush()

        // Then
        const taskIds = tasks.value.map((t) => t.id)
        expect(taskIds).toEqual(["shell", "errorTask", "finallyTask", "afterTask"])
    })

    it("shouldResolveComponentTypesFromErrorsFinallyAndAfterExecutionSections", async () => {
        // Given
        federated.resolveRemoteComponent.mockClear()
        givenSource(allSectionsSource, allSectionsFlow)

        // When
        useExecutionArtifacts()
        await flush()

        // Then
        const expectedTypes = [AFTER_TASK, ERROR_TASK, FINALLY_TASK, RUNNER, SHELL].sort()
        expect(federated.resolveRemoteComponent).toHaveBeenCalledWith(
            expectedTypes.map((cls) => ({cls, version: undefined})),
        )
    })

    it("shouldListArtifactsFromErrorsFinallyAndAfterExecutionTasks", async () => {
        // Given
        givenSource(allSectionsSource, allSectionsFlow)
        federated.taskAdditionalInfoRemote.value = {
            [`${SHELL}/logs`]: {title: "Shell logs"},
            [`${ERROR_TASK}/diagnostics`]: {title: "Error report"},
            [`${RUNNER}/details`]: {title: "Runner details"},
            [`${AFTER_TASK}/summary`]: {title: "Execution summary"},
        }

        // When
        const {artifacts} = useExecutionArtifacts()
        await flush()

        // Then
        expect(artifacts.value).toEqual([
            {key: `shell:${SHELL}/logs`, taskId: "shell", taskType: `${SHELL}/logs`, cls: SHELL, title: "Shell logs", description: undefined},
            {key: `errorTask:${ERROR_TASK}/diagnostics`, taskId: "errorTask", taskType: `${ERROR_TASK}/diagnostics`, cls: ERROR_TASK, title: "Error report", description: undefined},
            {key: `finallyTask:${RUNNER}/details`, taskId: "finallyTask", taskType: `${RUNNER}/details`, cls: FINALLY_TASK, title: "Runner details", description: undefined},
            {key: `afterTask:${AFTER_TASK}/summary`, taskId: "afterTask", taskType: `${AFTER_TASK}/summary`, cls: AFTER_TASK, title: "Execution summary", description: undefined},
        ])
    })
})
