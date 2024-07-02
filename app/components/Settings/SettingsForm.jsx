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
import { isFeatureEnabled } from "../../utils/isFeatureEnabled";

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

  const IsFeatureEnabled = ({ feature }) => {
    if (!isFeatureEnabled(billingPlan, feature)) {
      return <ShowUpgradeMessage />;
    }
  };

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
                <Tooltip
                  content="Upgrade to access this feature"
                  // active={
                  //   !isFeatureEnabled(
                  //     billingPlan,
                  //     "Advanced Sentiment Analysis",
                  //   )
                  // }
                >
                  <Checkbox
                    label={"Enable Sentiment Analysis"}
                    checked={enableSentimentAnalysis}
                    onChange={(newValue) =>
                      setEnableSentimentAnalysis(newValue)
                    }
                    name="enableSentimentAnalysis"
                    value="on"
                    disabled={
                      !isFeatureEnabled(
                        billingPlan,
                        "Advanced Sentiment Analysis",
                      )
                    }
                  />
                </Tooltip>
                <IsFeatureEnabled feature={"Advanced Sentiment Analysis"} />

                <Tooltip
                  content="Upgrade to access this feature"
                  // active={!isFeatureEnabled(billingPlan, "Automated Responses")}
                >
                  <Checkbox
                    label={"Enable Automated Responses"}
                    checked={enableAutomatedResponses}
                    onChange={(newValue) =>
                      setEnableAutomatedResponses(newValue)
                    }
                    name="enableAutomatedResponses"
                    value="on"
                    disabled={
                      !isFeatureEnabled(billingPlan, "Automated Responses")
                    }
                  />
                </Tooltip>
                <IsFeatureEnabled feature={"Automated Responses"} />

                <Tooltip
                  content="Upgrade to access this feature"
                  // active={!isFeatureEnabled(billingPlan, "Images or Video")}
                >
                  <Checkbox
                    label={"Allow Images or Videos"}
                    checked={allowMedia}
                    onChange={(newValue) => setAllowMedia(newValue)}
                    name="allowMedia"
                    value="on"
                    disabled={!isFeatureEnabled(billingPlan, "Images or Video")}
                  />
                </Tooltip>
                <IsFeatureEnabled feature={"Images or Video"} />

                <Tooltip
                  content="Upgrade to access this feature"
                  // active={!isFeatureEnabled(billingPlan, "Review Moderation")}
                >
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
                    disabled={
                      !isFeatureEnabled(billingPlan, "Review Moderation")
                    }
                  />
                </Tooltip>
                <IsFeatureEnabled feature={"Review Moderation"} />

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
