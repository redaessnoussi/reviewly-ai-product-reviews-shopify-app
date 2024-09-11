import React, { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useActionData, Form, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  BlockStack,
  Banner,
} from "@shopify/polaris";
import { sendSupportEmail } from "../utils/sendEmails";

// Server-side action function
export const action = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const reason = formData.get("reason");
  const message = formData.get("message");

  const errors = {};

  // Validation checks
  if (!name) errors.name = "Name is required";
  if (!email) errors.email = "Email is required";
  if (!reason) errors.reason = "Please select a reason for contact";
  if (!message) errors.message = "Message is required";

  // If there are validation errors, return them
  if (Object.keys(errors).length) {
    return json({ errors }, { status: 400 });
  }

  try {
    // Call the sendSupportEmail function to send the email
    await sendSupportEmail({
      to: "redavan95@gmail.com",
      name,
      email,
      reason,
      message,
    });

    // If the email is sent successfully, return a success response
    return json({ success: true });
  } catch (error) {
    console.error("Failed to send support email:", error);

    // Check if it's the specific Resend error
    if (error.statusCode === 403) {
      return json(
        {
          errors: {
            form: "Unable to send email. You only send to authorized email addresses at Resend.",
          },
        },
        { status: 403 },
      );
    }

    // For any other errors
    return json(
      { errors: { form: "Failed to send message. Please try again later." } },
      { status: 500 },
    );
  }
};

export default function ContactSupport() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    reason: "",
    message: "",
  });

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    if (actionData?.success) {
      setShowSuccessBanner(true);
      // Clear form state on successful submission
      setFormState({
        name: "",
        email: "",
        reason: "",
        message: "",
      });
      // Hide success banner after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  const handleChange = (value, field) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Page
      title="Contact Support"
      subtitle="We're here to help. Fill out the form below and we'll get back to you as soon as possible."
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              {showSuccessBanner && (
                <Banner
                  tone="success"
                  onDismiss={() => setShowSuccessBanner(false)}
                >
                  Your message has been sent successfully. We'll get back to you
                  soon.
                </Banner>
              )}
              {actionData?.errors?.form && (
                <Banner
                  tone="critical"
                  onDismiss={() => setShowSuccessBanner(false)}
                >
                  {actionData.errors.form}
                </Banner>
              )}
              <Form method="post">
                <FormLayout>
                  <TextField
                    label="Name"
                    name="name"
                    value={formState.name}
                    onChange={(value) => handleChange(value, "name")}
                    error={actionData?.errors?.name}
                  />
                  <TextField
                    type="email"
                    label="Email"
                    name="email"
                    value={formState.email}
                    onChange={(value) => handleChange(value, "email")}
                    error={actionData?.errors?.email}
                  />
                  <Select
                    label="Reason for contact"
                    name="reason"
                    options={[
                      { label: "Select a reason", value: "" },
                      { label: "Billing inquiry", value: "billing" },
                      { label: "Technical support", value: "technical" },
                      { label: "Feature request", value: "feature" },
                      { label: "Other", value: "other" },
                    ]}
                    value={formState.reason}
                    onChange={(value) => handleChange(value, "reason")}
                    error={actionData?.errors?.reason}
                  />
                  <TextField
                    label="Message"
                    name="message"
                    value={formState.message}
                    onChange={(value) => handleChange(value, "message")}
                    multiline={4}
                    error={actionData?.errors?.message}
                  />
                  <Button submit primary loading={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send message"}
                  </Button>
                </FormLayout>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
