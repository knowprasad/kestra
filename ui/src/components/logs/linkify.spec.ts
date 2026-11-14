import {describe, it, expect} from "vitest"
import {processLinkTags, linkTagsAsText} from "./linkify"

describe("linkify", () => {
    describe("processLinkTags", () => {
        it("converts a complete marker into a router-md tag carrying all three attributes", () => {
            const input = "Execution started: [[link execution=\"exec123\" flowId=\"my_flow\" namespace=\"prod.kestra\"]]"
            const expected = "Execution started: <router-md execution=\"exec123\" flowId=\"my_flow\" namespace=\"prod.kestra\"></router-md>"

            expect(processLinkTags(input)).toBe(expected)
        })

        it("replaces several markers within one message", () => {
            const input = "Step 1: [[link execution=\"e1\" flowId=\"f1\" namespace=\"n1\"]] followed by [[link execution=\"e2\" flowId=\"f2\" namespace=\"n2\"]]."
            const expected = "Step 1: <router-md execution=\"e1\" flowId=\"f1\" namespace=\"n1\"></router-md> followed by <router-md execution=\"e2\" flowId=\"f2\" namespace=\"n2\"></router-md>."

            expect(processLinkTags(input)).toBe(expected)
        })

        it("leaves a marker missing any one of the three attributes unchanged", () => {
            const missingExecution = "[[link flowId=\"f1\" namespace=\"n1\"]]"
            const missingFlowId = "[[link execution=\"e1\" namespace=\"n1\"]]"
            const missingNamespace = "[[link execution=\"e1\" flowId=\"f1\"]]"
            const emptyAttribute = "[[link execution=\"\" flowId=\"f1\" namespace=\"n1\"]]"

            expect(processLinkTags(missingExecution)).toBe(missingExecution)
            expect(processLinkTags(missingFlowId)).toBe(missingFlowId)
            expect(processLinkTags(missingNamespace)).toBe(missingNamespace)
            expect(processLinkTags(emptyAttribute)).toBe(emptyAttribute)
        })

        it("preserves surrounding text and returns a message without markers as is", () => {
            const plainMessage = "Ordinary log line with no links."
            expect(processLinkTags(plainMessage)).toBe(plainMessage)

            const withSurrounding = "prefix text [[link execution=\"e1\" flowId=\"f1\" namespace=\"n1\"]] suffix text"
            expect(processLinkTags(withSurrounding)).toBe("prefix text <router-md execution=\"e1\" flowId=\"f1\" namespace=\"n1\"></router-md> suffix text")
        })

        it("correctly parses attributes provided in a different order", () => {
            const input = "[[link namespace=\"custom.ns\" execution=\"exec-456\" flowId=\"flow-xyz\"]]"
            const expected = "<router-md execution=\"exec-456\" flowId=\"flow-xyz\" namespace=\"custom.ns\"></router-md>"

            expect(processLinkTags(input)).toBe(expected)
        })
    })

    describe("linkTagsAsText", () => {
        it("replaces a complete marker with the execution id alone", () => {
            const input = "Triggered by [[link execution=\"exec-999\" flowId=\"worker_flow\" namespace=\"system\"]]"
            const expected = "Triggered by exec-999"

            expect(linkTagsAsText(input)).toBe(expected)
        })

        it("leaves an incomplete marker unchanged", () => {
            const incomplete = "Failed link [[link execution=\"exec-999\" flowId=\"worker_flow\"]]"

            expect(linkTagsAsText(incomplete)).toBe(incomplete)
        })

        it("correctly parses attributes provided in a different order", () => {
            const input = "[[link flowId=\"order_flow\" namespace=\"sales\" execution=\"exec-order-1\"]]"

            expect(linkTagsAsText(input)).toBe("exec-order-1")
        })
    })
})
