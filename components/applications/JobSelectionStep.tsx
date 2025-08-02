"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Building,
  DollarSign,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useApplicationWorkflowStore } from "@/store/application-workflow";
import { Database } from "@/types/database.types";

type JobPosting = Database["public"]["Tables"]["job_postings"]["Row"];

interface JobSearchResponse {
  jobs: JobPosting[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function JobSelectionStep() {
  const { selectedJob, setSelectedJob } = useApplicationWorkflowStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const searchJobs = async (
    query: string,
    pageNum: number = 1,
    append: boolean = false
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        page: pageNum.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/jobs?${params}`);
      if (!response.ok) {
        throw new Error("Failed to search jobs");
      }

      const data: JobSearchResponse = await response.json();

      if (append) {
        setJobs((prev) => [...prev, ...data.jobs]);
      } else {
        setJobs(data.jobs);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
      if (!append) {
        setJobs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial jobs
    searchJobs("");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    searchJobs(searchTerm, 1, false);
  };

  const handleLoadMore = () => {
    searchJobs(searchTerm, page + 1, true);
  };

  const handleSelectJob = (job: JobPosting) => {
    setSelectedJob(job);
  };

  const formatSalary = (salary: string | null) => {
    if (!salary) return "Salary not disclosed";
    return salary;
  };

  const formatJobType = (jobType: string | null) => {
    if (!jobType) return "Full-time";
    return jobType.charAt(0).toUpperCase() + jobType.slice(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Posted today";
    if (diffDays <= 7) return `Posted ${diffDays} days ago`;
    return `Posted ${date.toLocaleDateString()}`;
  };

  if (selectedJob) {
    return (
      <div className="space-y-6">
        <div className="text-center text-green-600">
          <div className="text-lg font-medium mb-2">✓ Job Selected</div>
          <p className="text-sm text-muted-foreground">
            You can proceed to the next step or choose a different job below.
          </p>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedJob.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{selectedJob.company_name}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedJob(null)}
              >
                Change Job
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {selectedJob.location}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                {formatSalary(selectedJob.salary_range)}
              </div>
              <Badge variant="outline">
                {formatJobType(selectedJob.job_type)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {selectedJob.description}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Search
        </Button>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        {loading && jobs.length === 0 ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">No jobs found</div>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search terms
            </p>
          </div>
        ) : (
          jobs.map((job) => (
            <Card
              key={job.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSelectJob(job)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">{job.company_name}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatSalary(job.salary_range)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(job.created_at)}
                      </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <Badge variant="outline">
                        {formatJobType(job.job_type)}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-4 flex-shrink-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && jobs.length > 0 && (
        <div className="text-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Load More Jobs
          </Button>
        </div>
      )}
    </div>
  );
}
