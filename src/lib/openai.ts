import { OpenAI } from "openai";
import { z } from "zod";
import { BrandProfilePromptInput, formatBrandContextForPrompt } from "@/lib/brand-profile-context";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const PlatformContentSchema = z.object({
  facebook: z.object({
    hook: z.string(),
    caption: z.string(),
    hashtags: z.array(z.string()),
  }).optional(),
  instagram: z.object({
    caption: z.string(),
    hashtags: z.array(z.string()),
    imagePrompt: z.string(),
  }).optional(),
  linkedin: z.object({
    hook: z.string(),
    caption: z.string(),
    cta: z.string(),
    hashtags: z.array(z.string()),
  }).optional(),
  youtube: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
  }).optional(),
  tiktok: z.object({
    hook: z.string(),
    caption: z.string(),
    hashtags: z.array(z.string()),
    videoConcept: z.string(),
  }).optional(),
});

type PlatformContent = z.infer<typeof PlatformContentSchema>;

export async function adaptIdeaToPlatforms(
  idea: string,
  brandProfile: BrandProfilePromptInput,
  platforms: string[],
  templateStructure?: string
) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not defined in the environment.");
  }

  // Cost and injection mitigation: limit idea text length
  if (idea.length > 1000) {
    throw new Error("Idea content is too long. Please keep it under 1000 characters.");
  }

  let systemPrompt = `You are a social media branding expert. You specialize in taking a single core idea and adapting it to multiple platforms while maintaining a consistent personal brand voice.

  User Brand Profile:
${formatBrandContextForPrompt(brandProfile)}
  
  Adapt the core idea to the requested platforms: ${platforms.join(", ")}.
  
  You MUST return your output strictly in JSON format.
  
  The JSON structure must match this schema:
  {
    "facebook": {
      "hook": "Facebook hook here",
      "caption": "Facebook caption here",
      "hashtags": ["tag1", "tag2"]
    },
    "instagram": {
      "caption": "Instagram caption here",
      "hashtags": ["tag1", "tag2"],
      "imagePrompt": "AI Image prompt here"
    },
    "linkedin": {
      "hook": "LinkedIn hook here",
      "caption": "LinkedIn caption here",
      "cta": "LinkedIn CTA here",
      "hashtags": ["tag1", "tag2"]
    },
    "youtube": {
      "title": "YouTube title here",
      "description": "YouTube description here",
      "tags": ["tag1", "tag2"]
    },
    "tiktok": {
      "hook": "TikTok hook here",
      "caption": "TikTok caption here",
      "hashtags": ["tag1", "tag2"],
      "videoConcept": "Video script concept here"
    }
  }
  
  Ensure:
  1. The hook is extremely engaging and tailored to each platform.
  2. The tone matches the specified Brand Tone.
  3. The language matches the specified Language.
  4. Descriptions, tags, CTAs, and hashtags are platform-appropriate.
  5. Only generate actual content for the requested platforms: ${platforms.join(", ")}. Leave other platforms out or return them with empty strings.`;

  if (templateStructure) {
    systemPrompt += `\n\nAdditionally, you MUST structure your caption/text outputs using this specific template outline:\n"${templateStructure}"`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Adapt this idea: "${idea}"` },
    ],
    response_format: { type: "json_object" },
  });

  const rawJson = response.choices[0].message.content;
  if (!rawJson) {
    throw new Error("Failed to get content from OpenAI");
  }

  let validated;
  try {
    const parsedJson = JSON.parse(rawJson);
    validated = PlatformContentSchema.parse(parsedJson);
  } catch (error) {
    console.error("OpenAI JSON validation error:", error);
    throw new Error("OpenAI generated content did not match the expected social media structure. Please try again.");
  }

  // Filter content to only return requested platforms
  const filteredContent: Partial<PlatformContent> = {};
  platforms.forEach(platform => {
    if (platform === "facebook" && validated.facebook) filteredContent.facebook = validated.facebook;
    if (platform === "instagram" && validated.instagram) filteredContent.instagram = validated.instagram;
    if (platform === "linkedin" && validated.linkedin) filteredContent.linkedin = validated.linkedin;
    if (platform === "youtube" && validated.youtube) filteredContent.youtube = validated.youtube;
    if (platform === "tiktok" && validated.tiktok) filteredContent.tiktok = validated.tiktok;
  });

  return filteredContent;
}
