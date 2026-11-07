import {describe, it, expect} from "vitest"
import {mount} from "@vue/test-utils"
import McpIcon from "./McpIcon.vue"

describe("McpIcon", () => {
    it("uses default values for fillColor, size, and strokeWidth", () => {
        const wrapper = mount(McpIcon)
        const svg = wrapper.find("svg")
        expect(svg.attributes("stroke")).toBe("currentColor")
        expect(svg.attributes("width")).toBe("24")
        expect(svg.attributes("height")).toBe("24")

        const paths = wrapper.findAll("path")
        expect(paths).toHaveLength(3)
        paths.forEach(p => {
            expect(p.attributes("stroke-width")).toBe("12")
        })
    })

    it("applies custom size to svg width and height", () => {
        const wrapper = mount(McpIcon, {props: {size: 32}})
        const svg = wrapper.find("svg")
        expect(svg.attributes("width")).toBe("32")
        expect(svg.attributes("height")).toBe("32")
    })

    it("applies custom fillColor to stroke and custom strokeWidth to each path", () => {
        const wrapper = mount(McpIcon, {props: {fillColor: "red", strokeWidth: 16}})
        const svg = wrapper.find("svg")
        expect(svg.attributes("stroke")).toBe("red")

        const paths = wrapper.findAll("path")
        expect(paths).toHaveLength(3)
        paths.forEach(p => {
            expect(p.attributes("stroke-width")).toBe("16")
        })
    })

    it("renders title element only when title prop is passed", () => {
        const withoutTitle = mount(McpIcon)
        expect(withoutTitle.find("title").exists()).toBe(false)

        const withTitle = mount(McpIcon, {props: {title: "Model Context Protocol"}})
        expect(withTitle.find("title").exists()).toBe(true)
        expect(withTitle.find("title").text()).toBe("Model Context Protocol")
    })

    it("sets aria-hidden to 'true' without title and absent with title carrying aria-label", () => {
        const withoutTitle = mount(McpIcon)
        expect(withoutTitle.attributes("aria-hidden")).toBe("true")
        expect(withoutTitle.attributes("aria-label")).toBeUndefined()

        const withTitle = mount(McpIcon, {props: {title: "Model Context Protocol"}})
        expect(withTitle.attributes("aria-hidden")).toBeUndefined()
        expect(withTitle.attributes("aria-label")).toBe("Model Context Protocol")
    })

    it("emits click with the mouse event when clicked", async () => {
        const wrapper = mount(McpIcon)
        await wrapper.trigger("click")
        expect(wrapper.emitted("click")).toHaveLength(1)
        expect(wrapper.emitted("click")![0][0]).toBeInstanceOf(MouseEvent)
    })
})
