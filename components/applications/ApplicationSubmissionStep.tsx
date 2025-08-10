"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  FileText,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { useApplicationWorkflowStore } from "@/store/application-workflow";

export function ApplicationSubmissionStep() {
  const {
    selectedJob,
    selectedResume,
    isSubmittingApplication,
    setSubmittingApplication,
    setError,
    resetWorkflow,
  } = useApplicationWorkflowStore();

  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    applicationId?: string;
    message: string;
  } | null>(null);

  const submitApplication = async () => {
    if (!selectedJob || !selectedResume) {
      setError("Missing required information");
      return;
    }

    setSubmittingApplication(true);
    setError(null);

    try {
      // Create the job application record
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          job_posting_id: selectedJob.id,
          company_name: selectedJob.company_name,
          position_title: selectedJob.title,
          status: "applied",
          applied_at: new Date().toISOString(),
          notes: notes || `Applied using resume: ${selectedResume.title}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit application");
      }

      const data = await response.json();

      setSubmissionResult({
        success: true,
        applicationId: data.application.id,
        message: "Application successfully submitted!",
      });
      setSubmitted(true);

      // Update applied_to array in resume (optional)
      try {
        await fetch(`/api/resumes/${selectedResume.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applied_to: [...(selectedResume.applied_to || []), selectedJob.id],
          }),
        });
      } catch (resumeUpdateError) {
        // Don't fail the whole process if resume update fails
        console.warn(
          "Failed to update resume applied_to list:",
          resumeUpdateError
        );
      }
    } catch (err) {
      setSubmissionResult({
        success: false,
        message:
          err instanceof Error ? err.message : "Failed to submit application",
      });
      setError(
        err instanceof Error ? err.message : "Failed to submit application"
      );
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handleFinish = () => {
    resetWorkflow();
  };

  if (!selectedJob || !selectedResume) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <div className="text-muted-foreground mb-2">Missing Information</div>
        <p className="text-sm text-muted-foreground">
          Please complete all previous steps before submitting your application
        </p>
      </div>
    );
  }

  if (submitted && submissionResult?.success) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-600 mb-2">
            Application Submitted!
          </h3>
          <p className="text-muted-foreground">{submissionResult.message}</p>
        </div>


        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Your application has been sent and tracked. You can monitor its
            progress in the Applications dashboard.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <a href="/applications">View Applications</a>
            </Button>
            <Button
              onClick={handleFinish}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Complete
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Application Review */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Review Your Application
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Company</div>
                <div className="font-semibold text-lg">{selectedJob.company_name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Position</div>
                <div className="font-semibold">{selectedJob.title}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Location</div>
                <div className="font-semibold">{selectedJob.location}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Resume</div>
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  <FileText className="h-3 w-3" />
                  {selectedResume.title}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Ready to Submit
                </Badge>
              </div>
            </div>
          </div>

          {/* Job Description Preview */}
          {selectedJob.description && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Job Description</div>
              <div className="bg-gray-50 p-4 rounded-lg text-sm max-h-32 overflow-y-auto">
                {selectedJob.description.slice(0, 300)}...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Additional Notes (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-2">
            Add any personal notes about this application for your reference
          </div>
          <Textarea
            id="notes"
            placeholder="e.g., Applied through referral from John, Follow up in 1 week..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-2"
          />
        </CardContent>
      </Card>

      {/* Error Display */}
      {submissionResult && !submissionResult.success && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-medium text-red-600">
                  Submission Failed
                </div>
                <div className="text-sm text-red-700 mt-1">
                  {submissionResult.message}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Application Button */}
      <div className="flex justify-center">
        <Button
          onClick={submitApplication}
          disabled={!selectedJob || !selectedResume || isSubmittingApplication}
          size="lg"
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3"
        >
          {isSubmittingApplication ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Briefcase className="h-4 w-4 mr-2" />
              Submit Application
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
