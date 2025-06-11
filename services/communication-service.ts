"use server"

import { put } from "@vercel/blob"
import { customAlphabet } from "nanoid"

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10)

/**
 * Uploads a PDF Blob to Vercel Blob storage.
 * @param pdfBlob The PDF Blob to upload.
 * @param filename The desired filename for the uploaded PDF.
 * @returns The public URL of the uploaded PDF.
 */
export async function uploadPdfToBlob(pdfBlob: Blob, filename: string): Promise<string> {
  try {
    const uniqueFilename = `${nanoid()}-${filename}`
    const { url } = await put(uniqueFilename, pdfBlob, {
      access: "public",
      addRandomSuffix: false, // We're adding our own nanoid suffix
    })
    console.log(`PDF uploaded to Vercel Blob: ${url}`)
    return url
  } catch (error) {
    console.error("Error uploading PDF to Vercel Blob:", error)
    throw new Error("Failed to upload PDF. Please check BLOB_READ_WRITE_TOKEN.")
  }
}

/**
 * Simulates sending an SMS message.
 * In a real application, this would integrate with an SMS API (e.g., Twilio, Vonage).
 * @param to The recipient's phone number.
 * @param message The content of the SMS message.
 * @returns A success status.
 */
export async function sendSms(
  to: string,
  message: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log(`--- SMS Simulation ---`)
    console.log(`To: ${to}`)
    console.log(`Message: ${message}`)
    console.log(`----------------------`)

    // In a real scenario, you'd call an SMS API here:
    // const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Messages.json', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //     'Authorization': 'Basic ' + btoa(`ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:${process.env.TWILIO_AUTH_TOKEN}`)
    //   },
    //   body: new URLSearchParams({
    //     To: to,
    //     From: '+15017122661', // Your Twilio phone number
    //     Body: message
    //   }).toString()
    // });
    // const data = await response.json();
    // if (!response.ok) {
    //   throw new Error(data.message || 'Failed to send SMS');
    // }

    return { success: true, message: "SMS simulated successfully!" }
  } catch (error: any) {
    console.error("Error simulating SMS:", error)
    return { success: false, error: error.message || "Failed to simulate SMS." }
  }
}
