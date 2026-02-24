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

interface IssueEmailProps {
  creatorName: string;
  issueTitle: string;
  issueSummary?: string | null;
  issueHtml: string;
  authorNote?: string | null;
  topics?: string[];
  readingTimeMinutes?: number | null;
  publishedAt: Date;
  unsubscribeUrl: string;
  trackingPixelUrl?: string;
  replyToEmail: string;
  webViewUrl?: string;
}

export function IssueEmail({
  creatorName,
  issueTitle,
  issueSummary,
  issueHtml,
  authorNote,
  topics = [],
  readingTimeMinutes,
  publishedAt,
  unsubscribeUrl,
  trackingPixelUrl,
  replyToEmail,
  webViewUrl,
}: IssueEmailProps) {
  const dateStr = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(publishedAt);

  return (
    <Html>
      <Head />
      <Preview>{issueSummary || issueTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={creatorNameStyle}>{creatorName}</Text>
          </Section>

          {/* Meta */}
          <Section style={metaSection}>
            <Text style={dateText}>{dateStr}</Text>
            {readingTimeMinutes && (
              <Text style={readTimeText}>预计阅读 {readingTimeMinutes} 分钟</Text>
            )}
          </Section>

          {/* Title */}
          <Heading style={h1}>{issueTitle}</Heading>

          {/* Topics */}
          {topics.length > 0 && (
            <Section style={topicsSection}>
              {topics.map((topic) => (
                <span key={topic} style={topicTag}>
                  {topic}
                </span>
              ))}
            </Section>
          )}

          {/* Summary for AI */}
          {issueSummary && (
            <Section style={summarySection}>
              <Text style={summaryText}>{issueSummary}</Text>
            </Section>
          )}

          <Hr style={hr} />

          {/* Main Content */}
          <Section style={contentSection}>
            <div dangerouslySetInnerHTML={{ __html: issueHtml }} />
          </Section>

          {/* Author Note */}
          {authorNote && (
            <>
              <Hr style={hr} />
              <Section style={authorNoteSection}>
                <Text style={authorNoteLabel}>作者说</Text>
                <Text style={authorNoteText}>{authorNote}</Text>
              </Section>
            </>
          )}

          <Hr style={hr} />

          {/* Reply CTA */}
          <Section style={replySection}>
            <Text style={replyText}>
              有什么想法？直接回复这封邮件，我会认真阅读每一条回复。
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            {webViewUrl && (
              <Text style={footerText}>
                在浏览器中查看：<Link href={webViewUrl} style={footerLink}>点击这里</Link>
              </Text>
            )}
            <Text style={footerText}>
              你收到此邮件是因为你订阅了 {creatorName} 的 Space。
              如不再需要，可以{" "}
              <Link href={unsubscribeUrl} style={footerLink}>
                取消订阅
              </Link>
              。
            </Text>
          </Section>

          {/* Tracking pixel (invisible) */}
          {trackingPixelUrl && (
            <img
              src={trackingPixelUrl}
              width="1"
              height="1"
              alt=""
              style={{ display: "none" }}
            />
          )}
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
  padding: "0 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  maxWidth: "640px",
};

const header = {
  backgroundColor: "#18181b",
  borderRadius: "8px 8px 0 0",
  padding: "20px 40px",
};

const creatorNameStyle = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};

const metaSection = {
  display: "flex",
  padding: "16px 40px 0",
};

const dateText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
  display: "inline",
};

const readTimeText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 0 16px",
  display: "inline",
};

const h1 = {
  color: "#111827",
  fontSize: "28px",
  fontWeight: "bold",
  lineHeight: "1.3",
  margin: "16px 40px 8px",
};

const topicsSection = {
  padding: "0 40px 8px",
};

const topicTag = {
  display: "inline-block",
  backgroundColor: "#f3f4f6",
  color: "#374151",
  fontSize: "12px",
  padding: "2px 10px",
  borderRadius: "99px",
  marginRight: "6px",
  marginBottom: "4px",
};

const summarySection = {
  backgroundColor: "#f8fafc",
  borderLeft: "3px solid #6366f1",
  margin: "16px 40px",
  padding: "12px 16px",
  borderRadius: "0 4px 4px 0",
};

const summaryText = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "24px",
  fontStyle: "italic",
  margin: "0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "0 40px",
};

const contentSection = {
  padding: "24px 40px",
  color: "#1f2937",
  fontSize: "16px",
  lineHeight: "28px",
};

const authorNoteSection = {
  backgroundColor: "#fef9ee",
  margin: "0 40px",
  padding: "16px 20px",
  borderRadius: "6px",
};

const authorNoteLabel = {
  color: "#92400e",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 8px",
};

const authorNoteText = {
  color: "#78350f",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};

const replySection = {
  padding: "20px 40px",
};

const replyText = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
  fontStyle: "italic",
  margin: "0",
};

const footer = {
  padding: "0 40px",
};

const footerText = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "4px 0",
};

const footerLink = {
  color: "#6366f1",
  textDecoration: "underline",
};
