import {describe, it, expect, vi} from "vitest"
import type {ComposerTranslation} from "vue-i18n"
import {iterationLabel} from "./iterationLabel"
import {DISPLAY_MAX_LINE_CHARS} from "../../utils/utils"

describe("iterationLabel", () => {
    function createMockTranslation() {
        return vi.fn((key: string, values?: Record<string, unknown>) => {
            if (key === "iteration_number") {
                return `Iteration #${values?.number}`
            }
            return key
        }) as unknown as ComposerTranslation
    }

    it("returns the value capped for display when a run has a value", () => {
        const t = createMockTranslation()
        const result = iterationLabel(t, {value: "simple-value"}, 1)

        expect(result).toBe("simple-value")
        expect(t).not.toHaveBeenCalled()
    })

    it("falls back to translated positional label receiving position as number when run has no value", () => {
        const t = createMockTranslation()
        const result = iterationLabel(t, {}, 5)

        expect(result).toBe("Iteration #5")
        expect(t).toHaveBeenCalledWith("iteration_number", {number: 5})
    })

    it("falls back to translated positional label when value is undefined or null", () => {
        const t1 = createMockTranslation()
        expect(iterationLabel(t1, {value: undefined}, 3)).toBe("Iteration #3")
        expect(t1).toHaveBeenCalledWith("iteration_number", {number: 3})

        const t2 = createMockTranslation()
        expect(iterationLabel(t2, {value: null}, 4)).toBe("Iteration #4")
        expect(t2).toHaveBeenCalledWith("iteration_number", {number: 4})
    })

    it("stringifies a non-string value before capping", () => {
        const t = createMockTranslation()

        expect(iterationLabel(t, {value: 42}, 1)).toBe("42")
        expect(iterationLabel(t, {value: true}, 2)).toBe("true")
        expect(iterationLabel(t, {value: {toString: () => "custom_obj"}}, 3)).toBe("custom_obj")
        expect(t).not.toHaveBeenCalled()
    })

    it("counts an empty-string value as absent and takes the fallback branch", () => {
        const t = createMockTranslation()
        const result = iterationLabel(t, {value: ""}, 2)

        expect(result).toBe("Iteration #2")
        expect(t).toHaveBeenCalledWith("iteration_number", {number: 2})
    })

    it("shortens a value longer than the display cap", () => {
        const t = createMockTranslation()
        const longValue = "x".repeat(DISPLAY_MAX_LINE_CHARS + 500)
        const result = iterationLabel(t, {value: longValue}, 1)

        expect(result.length).toBe(DISPLAY_MAX_LINE_CHARS)
        expect(result).toBe("x".repeat(DISPLAY_MAX_LINE_CHARS))
        expect(t).not.toHaveBeenCalled()
    })
})
