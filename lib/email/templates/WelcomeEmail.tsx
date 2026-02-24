import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  creatorName: string;
  subscriberName?: string;
  subscriberEmail: string;
  unsubscribeUrl: string;
  appUrl: string;
  creatorSlug: string;
  mcpInstallCode?: string;
  customBody?: string; // Overrides default body; supports {name} and {creatorName}
}

export function WelcomeEmail({
  creatorName,
  subscriberName,
  subscriberEmail,
  unsubscribeUrl,
  appUrl,
  creatorSlug,
  mcpInstallCode,
  customBody,
}: WelcomeEmailProps) {
  const renderCustomBody = (body: string) =>
    body
      .replace(/\{name\}/g, subscriberName || subscriberEmail)
      .replace(/\{creatorName\}/g, creatorName)
      .split("\n")
      .filter(Boolean)
      .map((line, i) => <Text key={i} style={text}>{line}</Text>);

  return (
    <Html>
      <Head />
      <Preview>欢迎订阅 {creatorName} 的 Space</Preview>
      <Body style={main}>
        <Container style={container}>
          {customBody ? (
            renderCustomBody(customBody)
          ) : (
            <>
              <Heading style={h1}>欢迎！</Heading>
              <Text style={text}>
                感谢你订阅 <strong>{creatorName}</strong> 的 Space。
              </Text>
              <Text style={text}>
                你订阅的邮箱是：{subscriberEmail}
              </Text>
              <Hr style={hr} />
              <Text style={text}>
                <strong>你即将获得什么：</strong>
              </Text>
              <Text style={listItem}>· 定期发送的深度内容</Text>
              <Text style={listItem}>· 内容同时可通过 API 访问（AI 友好格式）</Text>
            </>
          )}
          {mcpInstallCode && (
            <>
              <Hr style={hr} />
              <Heading style={h2}>🤖 MCP 订阅（可选）</Heading>
              <Text style={text}>
                如果你使用 Claude Desktop 或 Cursor，可以将此 Space 添加为 MCP 工具，让 AI 助手在你提问时实时检索内容：
              </Text>
              <Section style={codeBlock}>
                <Text style={code}>{mcpInstallCode}</Text>
              </Section>
              <Text style={smallText}>
                添加后，你可以问 AI：「最近有什么新内容？」或搜索历史内容。
              </Text>
            </>
          )}
          <Hr style={hr} />

          <Text style={smallText}>
            如果你不再希望收到此邮件，可以随时{" "}
            <Link href={unsubscribeUrl} style={link}>
              取消订阅
            </Link>
            。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0 20px",
  padding: "0 40px",
};

const h2 = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "20px 0 10px",
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 40px",
  margin: "10px 0",
};

const listItem = {
  color: "#555",
  fontSize: "15px",
  lineHeight: "24px",
  padding: "0 40px 0 60px",
  margin: "4px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 40px",
};

const codeBlock = {
  backgroundColor: "#f4f4f5",
  borderRadius: "6px",
  margin: "10px 40px",
  padding: "16px",
};

const code = {
  color: "#18181b",
  fontSize: "12px",
  fontFamily: "monospace",
  lineHeight: "20px",
  whiteSpace: "pre" as const,
};

const smallText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "20px",
  padding: "0 40px",
  margin: "10px 0",
};

const link = {
  color: "#6366f1",
};
