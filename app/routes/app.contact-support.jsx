// File: app/routes/app.contact-support.jsx

import React, { useState } from "react";
import { json } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  InlineError,
  BlockStack,
  Text,
  Banner,
} from "@shopify/polaris";

export async function action({ request }) {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const reason = formData.get("reason");
  const message = formData.get("message");

  // Validate form data
  const errors = {};
  if (!name) errors.name = "Name is required";
  if (!email) errors.email = "Email is required";
  if (!reason) errors.reason = "Reason is required";
  if (!message) errors.message = "Message is required";

  if (Object.keys(errors).length > 0) {
    return json({ errors });
  }

  // TODO: Implement actual form submission logic here
  // For now, we'll just simulate a successful submission
  return json({ success: true });
}

export default function ContactSupport() {
  const actionData = useActionData();
  const submit = useSubmit();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    reason: "",
    message: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    submit(event.currentTarget, { replace: true });
  };

  const handleChange = (value, name) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Page
      title="Contact Support"
      subtitle="We're here to help. Fill out the form below and we'll get back to you as soon as possible."
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              {actionData?.success && (
                <Banner tone="success">
                  Your message has been sent successfully. We'll get back to you
                  soon.
                </Banner>
              )}
              <form onSubmit={handleSubmit}>
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
                  <Button submit primary>
                    Send message
                  </Button>
                </FormLayout>
              </form>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
