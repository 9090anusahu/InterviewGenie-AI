




const { GoogleGenAI } = require("@google/genai")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

/**
 * 🔥 CLEAN FUNCTION (VERY IMPORTANT)
 * Fixes bad Gemini array like:
 * ["question", "abc", "intention", "xyz"]
 */
function cleanArray(data, type) {
    if (!Array.isArray(data)) return []

    // If already correct → return
    if (typeof data[0] === "object") return data

    const result = []

    for (let i = 0; i < data.length; i += 6) {
        if (type === "qa") {
            result.push({
                question: data[i + 1] || "",
                intention: data[i + 3] || "",
                answer: data[i + 5] || ""
            })
        }

        if (type === "skill") {
            result.push({
                skill: data[i + 1] || "",
                severity: data[i + 3] || "medium"
            })
        }

        if (type === "plan") {
            result.push({
                day: Number(data[i + 1]) || 1,
                focus: data[i + 3] || "",
                tasks: [data[i + 5] || ""]
            })
        }
    }

    return result
}

/**
 * ✅ INTERVIEW REPORT GENERATION
 */
async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `
You are an expert interviewer.

Return ONLY valid JSON in this exact format:

{
  "title": "string",
  "matchScore": number,
  "technicalQuestions": [
    {
      "question": "string",
      "intention": "string",
      "answer": "string"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "string",
      "intention": "string",
      "answer": "string"
    }
  ],
  "skillGaps": [
    {
      "skill": "string",
      "severity": "low | medium | high"
    }
  ],
  "preparationPlan": [
    {
      "day": number,
      "focus": "string",
      "tasks": ["string"]
    }
  ]
}

STRICT RULES:
- Generate EXACTLY 5 technical questions
- Generate EXACTLY 5 behavioral questions
- Do NOT return arrays of strings
- Do NOT include labels like "question", "skill"
- Return proper JSON objects only

DATA:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
    })

    let parsed

    try {
        parsed = JSON.parse(response.text)
    } catch (err) {
        console.error("❌ JSON Parse Error:", response.text)
        throw new Error("Invalid AI JSON")
    }

    // 🔥 FIX STRUCTURE
    parsed.technicalQuestions = cleanArray(parsed.technicalQuestions, "qa")
    parsed.behavioralQuestions = cleanArray(parsed.behavioralQuestions, "qa")
    parsed.skillGaps = cleanArray(parsed.skillGaps, "skill")
    parsed.preparationPlan = cleanArray(parsed.preparationPlan, "plan")

    console.log("✅ FINAL CLEAN DATA:", parsed)

    return parsed
}

/**
 * ✅ HTML → PDF
 */
async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })

    const page = await browser.newPage()

    await page.setContent(htmlContent, {
        waitUntil: "networkidle0"
    })

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

/**
 * ✅ RESUME PDF GENERATION
 */
async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const prompt = `
Create a professional ATS-friendly resume in HTML format.

Return ONLY JSON:
{
  "html": "<html>...</html>"
}

Candidate Data:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
    })

    let parsed

    try {
        parsed = JSON.parse(response.text)
    } catch (err) {
        console.error("❌ Resume JSON Error:", response.text)
        throw new Error("Invalid Resume JSON")
    }

    const pdfBuffer = await generatePdfFromHtml(parsed.html)

    return pdfBuffer
}

module.exports = {
    generateInterviewReport,
    generateResumePdf
}