import {
  Html, Head, Body, Container, Section, Text,
  Heading, Hr, Link, Preview,
} from "@react-email/components";
import * as React from "react";

interface GreetingEmailProps {
  creatorName: string;
  subscriberName?: string;
  subject: string;
  body: string; // plain text body with {name} {creatorName} placeholders already resolved
  unsubscribeUrl: string;
}

export function GreetingEmail({
  creatorName,
  subscriberName,
  subject,
  body,
  unsubscribeUrl,
}: GreetingEmailProps) {
  const greeting = subscriberName ? `你好，${subscriberName}` : "你好";

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: "#ffffff", borderRadius: 12, padding: "32px 40px", border: "1px solid #e5e7eb" }}>
            <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>{creatorName}</Text>
            <Hr style={{ borderColor: "#f3f4f6", margin: "8px 0 24px" }} />

            <Text style={{ fontSize: 16, color: "#374151", marginBottom: 8 }}>{greeting}，</Text>

            {body.split("\n").filter(Boolean).map((line, i) => (
              <Text key={i} style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, marginBottom: 8 }}>
                {line}
              </Text>
            ))}

            <Hr style={{ borderColor: "#f3f4f6", margin: "24px 0 16px" }} />
            <Text style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" as const }}>
              {creatorName} · 如不想继续接收邮件，
              <Link href={unsubscribeUrl} style={{ color: "#9ca3af" }}>点击退订</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
