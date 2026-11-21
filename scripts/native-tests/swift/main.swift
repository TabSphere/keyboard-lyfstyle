import Foundation

struct GoldenFile: Decodable {
    struct Case: Decodable {
        let styleId: String
        let input: String
        let expected: String
    }
    let cases: [Case]
}

do {
    guard CommandLine.arguments.count == 3 else {
        throw NSError(domain: "GoldenTests", code: 1, userInfo: [NSLocalizedDescriptionKey: "Usage: golden-tests styles.json golden-tests.json"])
    }
    let catalogueData = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
    let goldenData = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))
    let catalogue = try StyleCatalogue(data: catalogueData)
    let fixtures = try JSONDecoder().decode(GoldenFile.self, from: goldenData)
    var failures = 0
    for fixture in fixtures.cases {
        let actual = catalogue.transform(fixture.input, styleId: fixture.styleId)
        if actual != fixture.expected {
            failures += 1
            print("FAIL \(fixture.styleId): expected \(fixture.expected.debugDescription), got \(actual.debugDescription)")
        }
    }
    if failures > 0 {
        print("Swift golden tests failed: \(failures)")
        exit(1)
    }
    print("Swift golden tests passed: \(fixtures.cases.count)")
} catch {
    print("Swift golden test error: \(error.localizedDescription)")
    exit(1)
}
