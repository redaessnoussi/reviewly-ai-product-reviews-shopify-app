// SettingsForm.jsx

import React, { useState, useEffect } from "react";
import {
  Card,
  FormLayout,
  Checkbox,
  Button,
  Page,
  Layout,
  PageActions,
  Select,
  Icon,
  Tooltip,
  Link,
  Text,
} from "@shopify/polaris";
import { Form, useNavigate } from "@remix-run/react";

const SettingsForm = ({ initialSettings, billingPlan }) => {
  const [enableSentimentAnalysis, setEnableSentimentAnalysis] = useState(
    initialSettings.enableSentimentAnalysis,
  );
  const [enableAutomatedResponses, setEnableAutomatedResponses] = useState(
    initialSettings.enableAutomatedResponses,
  );
  const [allowMedia, setAllowMedia] = useState(initialSettings.allowMedia);
  const [reviewModeration, setReviewModeration] = useState(
    initialSettings.reviewModeration,
  );
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

  const ShowUpgradeMessage = () => (
    <Text as="span">
      Upgrade to a higher plan to enable this feature.{" "}
      <Link
        onClick={() => {
          navigate("/app/pricing");
        }}
      >
        Learn more
      </Link>
    </Text>
  );

  const handleSubmit = async (event) => {
    setIsSaving(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await fetch("/app/settings", {
      method: "post",
      body: formData,
    });
    setIsSaving(false);
  };

  return (
    <Page title="App Settings">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Form method="post" onSubmit={handleSubmit}>
              <FormLayout>
                <Tooltip content="Upgrade to access this feature">
                  <Checkbox
                    label={"Enable Sentiment Analysis"}
                    checked={enableSentimentAnalysis}
                    onChange={(newValue) =>
                      setEnableSentimentAnalysis(newValue)
                    }
                    name="enableSentimentAnalysis"
                    value="on"
                    disabled={billingPlan === "Free Plan"}
                  />
                </Tooltip>
                {billingPlan === "Free Plan" && <ShowUpgradeMessage />}

                <Tooltip content="Upgrade to access this feature">
                  <Checkbox
                    label={"Enable Automated Responses"}
                    checked={enableAutomatedResponses}
                    onChange={(newValue) =>
                      setEnableAutomatedResponses(newValue)
                    }
                    name="enableAutomatedResponses"
                    value="on"
                    disabled={billingPlan === "Free Plan"}
                  />
                </Tooltip>
                {billingPlan === "Free Plan" && <ShowUpgradeMessage />}

                <Tooltip content="Upgrade to access this feature">
                  <Checkbox
                    label={"Allow Images or Videos"}
                    checked={allowMedia}
                    onChange={(newValue) => setAllowMedia(newValue)}
                    name="allowMedia"
                    value="on"
                    disabled={billingPlan === "Free Plan"}
                  />
                </Tooltip>
                {billingPlan === "Free Plan" && <ShowUpgradeMessage />}

                <Tooltip content="Upgrade to access this feature">
                  <Select
                    label={"Review Moderation"}
                    options={[
                      { label: "All Reviews", value: "all" },
                      { label: "Only Negative Reviews", value: "negative" },
                      { label: "No Moderation", value: "none" },
                    ]}
                    value={reviewModeration}
                    onChange={(newValue) => setReviewModeration(newValue)}
                    name="reviewModeration"
                    disabled={billingPlan === "Free Plan"}
                  />
                </Tooltip>
                {billingPlan === "Free Plan" && <ShowUpgradeMessage />}

                <PageActions
                  primaryAction={{
                    content: "Save Settings",
                    loading: isSaving,
                    submit: true,
                  }}
                />
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default SettingsForm;
