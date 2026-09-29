import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type GuideLang = "en" | "tl";

export interface Localized {
    en: string;
    tl: string;
}

export interface PdfSection {
    id: string;
    label: Localized;
    description: Localized;
    steps: Localized[];
    tips?: Localized[];
}

interface GuidePdfDocumentProps {
    sections: PdfSection[];
    lang: GuideLang;
    title: string;
    subtitle: string;
    generatedAt: string;
}

const styles = StyleSheet.create({
    page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
    coverTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 6 },
    coverSubtitle: { fontSize: 11, color: "#555", marginBottom: 2 },
    coverMeta: { fontSize: 9, color: "#888", marginTop: 16 },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        marginTop: 14,
        marginBottom: 18,
    },
    sectionBlock: { marginBottom: 18 },
    sectionTitle: {
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        marginBottom: 4,
        color: "#111",
    },
    sectionDesc: {
        fontSize: 9.5,
        color: "#444",
        marginBottom: 8,
        lineHeight: 1.4,
    },
    stepsLabel: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: "#888",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    stepRow: { flexDirection: "row", marginBottom: 4 },
    stepNum: { width: 16, fontFamily: "Helvetica-Bold", fontSize: 9 },
    stepText: { flex: 1, fontSize: 9.5, lineHeight: 1.4 },
    tipsBox: {
        marginTop: 6,
        padding: 8,
        backgroundColor: "#fdf6e3",
        borderWidth: 1,
        borderColor: "#eee0b0",
    },
    tipsLabel: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: "#9a7d0a",
        marginBottom: 3,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    tipRow: { flexDirection: "row", marginBottom: 2 },
    tipBullet: { width: 10, fontSize: 9 },
    tipText: { flex: 1, fontSize: 9, lineHeight: 1.4, color: "#6b5900" },
    footer: {
        position: "absolute",
        bottom: 16,
        left: 32,
        right: 32,
        fontSize: 7.5,
        color: "#999",
        textAlign: "center",
    },
});

export function GuidePdfDocument({
    sections,
    lang,
    title,
    subtitle,
    generatedAt,
}: GuidePdfDocumentProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.coverTitle}>{title}</Text>
                <Text style={styles.coverSubtitle}>{subtitle}</Text>
                <Text style={styles.coverMeta}>
                    {lang === "en" ? "Generated" : "Nabuo noong"}: {generatedAt}
                </Text>
                <View style={styles.divider} />

                {sections.map((s) => (
                    <View key={s.id} style={styles.sectionBlock} wrap={false}>
                        <Text style={styles.sectionTitle}>{s.label[lang]}</Text>
                        <Text style={styles.sectionDesc}>
                            {s.description[lang]}
                        </Text>

                        <Text style={styles.stepsLabel}>
                            {lang === "en" ? "How to use" : "Paano Gamitin"}
                        </Text>
                        {s.steps.map((step, i) => (
                            <View key={i} style={styles.stepRow}>
                                <Text style={styles.stepNum}>{i + 1}.</Text>
                                <Text style={styles.stepText}>
                                    {step[lang]}
                                </Text>
                            </View>
                        ))}

                        {s.tips && s.tips.length > 0 && (
                            <View style={styles.tipsBox}>
                                <Text style={styles.tipsLabel}>
                                    {lang === "en" ? "Tips" : "Mga Paalala"}
                                </Text>
                                {s.tips.map((tip, i) => (
                                    <View key={i} style={styles.tipRow}>
                                        <Text style={styles.tipBullet}>
                                            •
                                        </Text>
                                        <Text style={styles.tipText}>
                                            {tip[lang]}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ))}

                <Text
                    style={styles.footer}
                    fixed
                    render={({ pageNumber, totalPages }) =>
                        `Wildflour Hospitality Group — Agency HR Portal  •  ${pageNumber} / ${totalPages}`
                    }
                />
            </Page>
        </Document>
    );
}
