import {defineComponent, markRaw, type Component} from "vue"
import {describe, expect, test} from "vitest"
import {KsIcon} from "@kestra-io/design-system"
import {i18nMount} from "../../../tests/unit/i18nMount"
import TaskRunPopupTabLabel from "./TaskRunPopupTabLabel.vue"
import type {LoadStatus} from "./composables/useTaskRunPopupData"

interface TabLabelProps {
    label: string
    status: LoadStatus
    count: number
    icon?: Component
}

const mountTabLabel = (props: TabLabelProps) => i18nMount(TaskRunPopupTabLabel, {
    props,
})

describe("TaskRunPopupTabLabel", () => {
    test("renders the label text", () => {
        const wrapper = mountTabLabel({label: "Outputs", status: "ready", count: 3})

        expect(wrapper.text()).toContain("Outputs")
    })

    test("loading shows the skeleton and neither tag", () => {
        const wrapper = mountTabLabel({label: "Outputs", status: "loading", count: 0})

        expect(wrapper.find('[data-test="tab-count-loading"]').exists()).toBe(true)
        expect(wrapper.find('[data-test="tab-count-error"]').exists()).toBe(false)
        expect(wrapper.find('[data-test="tab-count"]').exists()).toBe(false)
    })

    test("error shows the warning tag and not the count", () => {
        const wrapper = mountTabLabel({label: "Outputs", status: "error", count: 0})

        expect(wrapper.find('[data-test="tab-count-error"]').exists()).toBe(true)
        expect(wrapper.get('[data-test="tab-count-error"]').text()).toBe("!")
        expect(wrapper.find('[data-test="tab-count"]').exists()).toBe(false)
        expect(wrapper.find('[data-test="tab-count-loading"]').exists()).toBe(false)
    })

    test("ready shows the count tag carrying the count value", () => {
        const wrapper = mountTabLabel({label: "Outputs", status: "ready", count: 42})

        expect(wrapper.find('[data-test="tab-count"]').exists()).toBe(true)
        expect(wrapper.get('[data-test="tab-count"]').text()).toBe("42")
        expect(wrapper.find('[data-test="tab-count-loading"]').exists()).toBe(false)
        expect(wrapper.find('[data-test="tab-count-error"]').exists()).toBe(false)
    })

    test("a count of 0 still renders in the ready tag", () => {
        const wrapper = mountTabLabel({label: "Outputs", status: "ready", count: 0})

        expect(wrapper.find('[data-test="tab-count"]').exists()).toBe(true)
        expect(wrapper.get('[data-test="tab-count"]').text()).toBe("0")
    })

    test("the icon is rendered only when icon is passed", () => {
        const withoutIcon = mountTabLabel({label: "Outputs", status: "ready", count: 0})
        expect(withoutIcon.findComponent(KsIcon).exists()).toBe(false)

        const DummyIcon = markRaw(defineComponent({
            template: "<svg class=\"dummy-test-icon\" />",
        }))
        const withIcon = mountTabLabel({label: "Outputs", status: "ready", count: 0, icon: DummyIcon})
        expect(withIcon.findComponent(KsIcon).exists()).toBe(true)
        expect(withIcon.find(".dummy-test-icon").exists()).toBe(true)
    })
})
