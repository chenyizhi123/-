
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const parseProductImage = async (base64Image: string): Promise<Partial<Product>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `你是一个专业的店面会计助手。请识别这张图片中的商品信息。
            图片可能包含：价格表、手写进货单、或者带有价格标签的商品实拍。
            
            输出要求：
            1. 必须返回合法的 JSON 数组。
            2. 字段映射：
               - name: 商品名称
               - caseCost: 整箱进价 (数字)
               - caseQuantity: 每箱数量 (数字)
               - unitCost: 单件成本 (数字)
               - caseWholesalePrice: 整箱批发价 (数字)
               - wholesalePrice: 单件批发价 (数字)
               - retailPrice: 单件零售价/售价 (数字)
               - category: 类别 (必须是 "烟花", "鞭炮", "小烟花", "其他" 之一)
               - remarks: 备注信息
            3. 逻辑计算：如果图片里只有整箱价格和数量，请帮我算出 unitCost。
            4. 即使图片模糊，也请尽力猜测最可能的文字，不要留空 name。`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              caseCost: { type: Type.NUMBER },
              caseQuantity: { type: Type.NUMBER },
              unitCost: { type: Type.NUMBER },
              caseWholesalePrice: { type: Type.NUMBER },
              wholesalePrice: { type: Type.NUMBER },
              retailPrice: { type: Type.NUMBER },
              category: { type: Type.STRING },
              remarks: { type: Type.STRING }
            },
            required: ['name']
          }
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("AI 识别失败:", error);
    throw error;
  }
};
