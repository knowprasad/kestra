import {describe, it, expect, vi} from "vitest"
import {mount} from "@vue/test-utils"
import {defineComponent} from "vue"

const mockBindings = {
    theme: "plumage-dark",
    loadTaskIcon: vi.fn(),
    configureLanguage: vi.fn(),
}

vi.mock("../../../composables/useEditorBindings", () => ({
    useEditorBindings: () => mockBindings,
}))

vi.mock("@kestra-io/design-system", () => ({
    KsEditor: defineComponent({
        name: "KsEditor",
        props: {
            modelValue: String,
            original: String,
            lang: String,
            readOnly: Boolean,
            options: Object,
            theme: String,
            loadTaskIcon: Function,
            configureLanguage: Function,
        },
        template: "<div class=\"ks-editor-mock\" />",
    }),
}))

import DiffView from "./DiffView.vue"

function mountDiffView(props: {oldValue: string; newValue: string}) {
    return mount(DiffView, {props})
}

describe("DiffView", () => {
    it("passes newValue as modelValue and oldValue as original", () => {
        const wrapper = mountDiffView({
            oldValue: "id: flow_before\n",
            newValue: "id: flow_after\n",
        })
        const editor = wrapper.findComponent({name: "KsEditor"})

        expect(editor.props("modelValue")).toBe("id: flow_after\n")
        expect(editor.props("original")).toBe("id: flow_before\n")
    })

    it("configures the editor as read-only", () => {
        const wrapper = mountDiffView({
            oldValue: "before",
            newValue: "after",
        })
        const editor = wrapper.findComponent({name: "KsEditor"})

        expect(editor.props("readOnly")).toBe(true)
    })

    it("renders diff inline with diffSideBySide set to false", () => {
        const wrapper = mountDiffView({
            oldValue: "before",
            newValue: "after",
        })
        const editor = wrapper.findComponent({name: "KsEditor"})

        expect(editor.props("options")).toEqual({diffSideBySide: false})
    })

    it("sets the language to yaml", () => {
        const wrapper = mountDiffView({
            oldValue: "before",
            newValue: "after",
        })
        const editor = wrapper.findComponent({name: "KsEditor"})

        expect(editor.props("lang")).toBe("yaml")
    })

    it("passes through an empty oldValue rather than substituting a default", () => {
        const wrapper = mountDiffView({
            oldValue: "",
            newValue: "id: brand_new_flow\n",
        })
        const editor = wrapper.findComponent({name: "KsEditor"})

        expect(editor.props("original")).toBe("")
    })

    it("spreads editor bindings from useEditorBindings onto the editor", () => {
        const wrapper = mountDiffView({
            oldValue: "before",
            newValue: "after",
        })
        const editor = wrapper.findComponent({name: "KsEditor"})

        expect(editor.props("theme")).toBe("plumage-dark")
        expect(editor.props("loadTaskIcon")).toBe(mockBindings.loadTaskIcon)
        expect(editor.props("configureLanguage")).toBe(mockBindings.configureLanguage)
    })

    it("renders with the copilot-diff test handle", () => {
        const wrapper = mountDiffView({
            oldValue: "before",
            newValue: "after",
        })

        expect(wrapper.find("[data-test='copilot-diff']").exists()).toBe(true)
    })
})
