import {describe, expect, test} from "vitest"
import {i18nMount} from "../../../../../tests/unit/i18nMount"
import SettingRow from "./SettingRow.vue"

interface SettingRowProps {
    label: string
    description?: string
    stacked?: boolean
    required?: boolean
}

const mountSettingRow = (
    props: SettingRowProps,
    slots: Record<string, string> = {},
) => i18nMount(SettingRow, {
    props,
    slots,
})

describe("SettingRow", () => {
    test("renders the label", () => {
        const wrapper = mountSettingRow({label: "Theme"})

        expect(wrapper.get(".setting-row__label").text()).toBe("Theme")
    })

    test("renders required asterisk only when required is set", () => {
        const withoutRequired = mountSettingRow({label: "Theme"})
        expect(withoutRequired.find(".setting-row__required").exists()).toBe(false)

        const withRequired = mountSettingRow({label: "Theme", required: true})
        expect(withRequired.find(".setting-row__required").exists()).toBe(true)
        expect(withRequired.get(".setting-row__required").text()).toBe("*")
    })

    test("renders the description block from the description prop", () => {
        const wrapper = mountSettingRow({label: "Theme", description: "Choose your preferred theme"})

        expect(wrapper.find(".setting-row__description").exists()).toBe(true)
        expect(wrapper.get(".setting-row__description").text()).toBe("Choose your preferred theme")
    })

    test("renders description slot in place of prop, and block appears with no prop set", () => {
        const slotOverridingProp = mountSettingRow(
            {label: "Theme", description: "Prop description"},
            {description: "<span>Slot description</span>"},
        )
        expect(slotOverridingProp.get(".setting-row__description").text()).toBe("Slot description")

        const slotWithoutProp = mountSettingRow(
            {label: "Theme"},
            {description: "<span>Slot only description</span>"},
        )
        expect(slotWithoutProp.find(".setting-row__description").exists()).toBe(true)
        expect(slotWithoutProp.get(".setting-row__description").text()).toBe("Slot only description")
    })

    test("does not render description when neither prop nor slot is provided", () => {
        const wrapper = mountSettingRow({label: "Theme"})

        expect(wrapper.find(".setting-row__description").exists()).toBe(false)
    })

    test("applies stacked modifier class only when stacked is true", () => {
        const defaultRow = mountSettingRow({label: "Theme"})
        expect(defaultRow.classes()).not.toContain("setting-row--stacked")

        const stackedRow = mountSettingRow({label: "Theme", stacked: true})
        expect(stackedRow.classes()).toContain("setting-row--stacked")
    })

    test("renders default slot in the control area", () => {
        const wrapper = mountSettingRow(
            {label: "Theme"},
            {default: "<button class=\"test-btn\">Toggle</button>"},
        )

        expect(wrapper.find(".setting-row__control .test-btn").exists()).toBe(true)
        expect(wrapper.get(".setting-row__control .test-btn").text()).toBe("Toggle")
    })
})
