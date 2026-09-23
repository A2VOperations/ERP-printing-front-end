import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../lib/apiConfig";

export default function DesignProjectsView({ user, users = [] }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Selected Project for Step Work Submission / Review Modal
  const [selectedProject, setSelectedProject] = useState(null);

  // New Project Modal State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [stepTemplate, setStepTemplate] = useState("standard");
  const [customSteps, setCustomSteps] = useState([
    {
      title: "Briefing & Concept",
      instructions:
        "Gather project requirements, references, and create initial moodboard/concept.",
    },
    {
      title: "Initial Draft Design",
      instructions:
        "Create initial draft design layout and present for review.",
    },
    {
      title: "Client Feedback & Revisions",
      instructions: "Incorporate client revisions and refine details.",
    },
    {
      title: "Final Export & Delivery",
      instructions:
        "Prepare final high-resolution assets, source files, and export.",
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);

  // Work Submission State for Active Step
  const [activeStepId, setActiveStepId] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submissionLinks, setSubmissionLinks] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Review State for Admin/Manager
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/design-projects`, {
        headers: {
          "x-user-id": user?.email || user?.id || user?._id || "",
          "x-user-role": user?.role || "",
        },
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
        // Keep selected project updated if open
        if (selectedProject) {
          const updated = data.projects.find(
            (p) => p._id === selectedProject._id,
          );
          if (updated) setSelectedProject(updated);
        }
      } else {
        setError(data.error || "Failed to load projects.");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?._id, user?.email, user?.role, selectedProject?._id]);

  useEffect(() => {
    fetchProjects();
  }, [user?.id, user?._id, user?.email, fetchProjects]);

  // Update custom steps when step template changes
  const handleTemplateChange = (template) => {
    setStepTemplate(template);
    if (template === "standard") {
      setCustomSteps([
        {
          title: "Briefing & Concept",
          instructions:
            "Gather project requirements, references, and create initial moodboard/concept.",
        },
        {
          title: "Initial Draft Design",
          instructions:
            "Create initial draft design layout and present for review.",
        },
        {
          title: "Client Feedback & Revisions",
          instructions: "Incorporate client revisions and refine details.",
        },
        {
          title: "Final Export & Delivery",
          instructions:
            "Prepare final high-resolution assets, source files, and export.",
        },
      ]);
    } else if (template === "quick") {
      setCustomSteps([
        {
          title: "Initial Concept & Draft",
          instructions: "Prepare draft design and submit for quick approval.",
        },
        {
          title: "Final Asset Output",
          instructions: "Export and deliver final graphics.",
        },
      ]);
    } else if (template === "branding") {
      setCustomSteps([
        {
          title: "Brand Discovery & Moodboard",
          instructions:
            "Research target audience, competitors, and curate color/typography direction.",
        },
        {
          title: "Logo Concepts",
          instructions:
            "Design 3 distinct logo concepts and present vector mocks.",
        },
        {
          title: "Brand Assets & Collateral",
          instructions:
            "Design business cards, letterheads, and social banners.",
        },
        {
          title: "Brand Guidelines & Package Export",
          instructions: "Compile PDF style guide and pack SVG/PNG assets.",
        },
      ]);
    }
  };

  const handleAddCustomStep = () => {
    setCustomSteps((prev) => [
      ...prev,
      { title: `Step ${prev.length + 1}`, instructions: "" },
    ]);
  };

  const handleRemoveCustomStep = (index) => {
    setCustomSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepChange = (index, field, value) => {
    setCustomSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, [field]: value } : step)),
    );
  };

  // Create Project Submit
  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAssignedTo) {
      setError("Project title and assigned designer are required.");
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/design-projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || user?._id || user?.email || "",
          "x-user-role": user?.role || "",
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          clientName: newClientName.trim(),
          assignedTo: newAssignedTo,
          priority: newPriority,
          dueDate: newDueDate || null,
          steps: customSteps,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMsg("Design project created successfully!");
        setIsNewProjectModalOpen(false);
        setNewTitle("");
        setNewDescription("");
        setNewClientName("");
        setNewAssignedTo("");
        setNewDueDate("");
        fetchProjects();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setError(data.error || "Failed to create project.");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      setError("Could not connect to backend server.");
    } finally {
      setIsCreating(false);
    }
  };

  // File Upload Handler for Work Progress Submission
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE_URL}/api/design-projects/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          return data.attachment;
        }
        return null;
      });

      const results = await Promise.all(uploadPromises);
      const validAttachments = results.filter(Boolean);
      setUploadedFiles((prev) => [...prev, ...validAttachments]);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Failed to upload file preview.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveUploadedFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Step Work Progress
  const handleSubmitStepWork = async (stepId) => {
    if (!selectedProject || !stepId) return;

    const linksArray = submissionLinks
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (
      !submissionNotes.trim() &&
      linksArray.length === 0 &&
      uploadedFiles.length === 0
    ) {
      alert(
        "Please provide at least work notes, uploaded files, or external design links.",
      );
      return;
    }

    setIsSubmittingWork(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/design-projects/${selectedProject._id}/steps/${stepId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || user?._id || user?.email || "",
          },
          body: JSON.stringify({
            notes: submissionNotes.trim(),
            attachments: uploadedFiles,
            links: linksArray,
          }),
        },
      );
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`Work submitted for Step!`);
        setSelectedProject(data.project);
        setSubmissionNotes("");
        setSubmissionLinks("");
        setUploadedFiles([]);
        setActiveStepId(null);
        fetchProjects();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        alert("Failed to submit work: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error submitting step work:", err);
      alert("Error connecting to server.");
    } finally {
      setIsSubmittingWork(false);
    }
  };

  // Review Step Work Progress (Approve or Request Revision)
  const handleReviewStepWork = async (stepId, action) => {
    if (!selectedProject || !stepId) return;

    setIsReviewing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/design-projects/${selectedProject._id}/steps/${stepId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || user?._id || user?.email || "",
          },
          body: JSON.stringify({
            action,
            comment: reviewComment.trim(),
          }),
        },
      );
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(
          `Step ${action === "Approved" ? "Approved" : "Revision Requested"}!`,
        );
        setSelectedProject(data.project);
        setReviewComment("");
        fetchProjects();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        alert("Failed to review step: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error reviewing step:", err);
      alert("Error connecting to server.");
    } finally {
      setIsReviewing(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/design-projects/${projectId}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json();
      if (data.success) {
        setSuccessMsg("Project deleted successfully");
        if (selectedProject?._id === projectId) setSelectedProject(null);
        fetchProjects();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        alert("Failed to delete project: " + data.error);
      }
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  // Filter projects logic
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.clientName &&
        p.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.assignedToName &&
        p.assignedToName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesPriority =
      priorityFilter === "All" || p.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // KPI Calculations
  const totalProjects = projects.length;
  const inProgressCount = projects.filter(
    (p) => p.status === "In Progress",
  ).length;
  const inReviewCount = projects.filter((p) => p.status === "In Review").length;
  const completedCount = projects.filter(
    (p) => p.status === "Completed",
  ).length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
              🎨
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Graphic Design Work Progress
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage graphic design projects, monitor sequential step progress,
            and submit work deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProjects}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Design Project
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-fade-in">
          <span>⚠️ {error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs font-semibold text-emerald-700 flex items-center gap-2 animate-fade-in">
          <span>✅ {successMsg}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-lg font-black">
            📁
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Projects
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              {totalProjects}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-lg font-black">
            ⚙️
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              In Progress
            </span>
            <h3 className="text-xl font-extrabold text-sky-600">
              {inProgressCount}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-md border border-amber-200/80 bg-amber-50/20 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-black">
            ⏳
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Pending Review
            </span>
            <h3 className="text-xl font-extrabold text-amber-700">
              {inReviewCount}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-black">
            🎉
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Completed
            </span>
            <h3 className="text-xl font-extrabold text-emerald-600">
              {completedCount}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-md border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by title, client, designer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 transition-all bg-slate-50/50"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Status:
          </span>
          {["All", "In Progress", "In Review", "Completed", "On Hold"].map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-md border border-slate-200">
          <svg
            className="animate-spin h-8 w-8 text-sky-600 mb-3"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Design Projects...
          </span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-md border border-slate-200 text-center">
          <span className="text-4xl mb-3">🎨</span>
          <h3 className="text-base font-bold text-slate-800">
            No Design Projects Found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {searchTerm || statusFilter !== "All"
              ? "No projects match your search/filter criteria."
              : "No graphic design projects have been created yet. Click 'New Design Project' above to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const approvedStepsCount =
              project.steps?.filter((s) => s.status === "Approved").length || 0;
            const totalSteps = project.steps?.length || 1;
            const progressPercent = Math.round(
              (approvedStepsCount / totalSteps) * 100,
            );

            // Active or next step requiring attention
            const currentStep =
              project.steps?.find(
                (s) =>
                  s.status === "In Progress" ||
                  s.status === "Submitted" ||
                  s.status === "Revision Requested",
              ) || project.steps?.[0];

            return (
              <div
                key={project._id}
                onClick={() => setSelectedProject(project)}
                className="bg-white rounded-md border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${
                        project.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : project.status === "In Review"
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {project.status === "In Review"
                        ? "⌛ In Review"
                        : project.status}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        project.priority === "Urgent"
                          ? "bg-rose-100 text-rose-700"
                          : project.priority === "High"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {project.priority} Priority
                    </span>
                  </div>

                  {/* Title & Client */}
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  {project.clientName && (
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Client:{" "}
                      <span className="text-slate-700">
                        {project.clientName}
                      </span>
                    </p>
                  )}

                  {project.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  {/* Step Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-600 text-[11px]">
                        Steps Progress ({approvedStepsCount}/{totalSteps})
                      </span>
                      <span className="text-sky-600">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Step Timeline Pills */}
                  <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
                    {project.steps?.map((step) => (
                      <div
                        key={step._id}
                        title={`Step ${step.stepNumber}: ${step.title} (${step.status})`}
                        className={`h-2 flex-1 rounded-full ${
                          step.status === "Approved"
                            ? "bg-emerald-500"
                            : step.status === "Submitted"
                              ? "bg-amber-400 animate-pulse"
                              : step.status === "In Progress"
                                ? "bg-sky-500"
                                : step.status === "Revision Requested"
                                  ? "bg-rose-500"
                                  : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px]">
                      {project.assignedToName?.charAt(0).toUpperCase() || "D"}
                    </div>
                    <span className="truncate max-w-27.5">
                      {project.assignedToName || "Designer"}
                    </span>
                  </div>

                  {project.dueDate ? (
                    <span className="text-slate-500">
                      Due: {new Date(project.dueDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span>No due date</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* PROJECT DETAILS & STEP WORK SUBMISSION MODAL */}
      {/* ======================================================== */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-md shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-slate-200">
            {/* Modal Top Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-sky-100 text-sky-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                    {selectedProject.status}
                  </span>
                  <span className="text-xs font-bold text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-500">
                    Assigned to {selectedProject.assignedToName}
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-slate-900">
                  {selectedProject.title}
                </h2>
                {selectedProject.clientName && (
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Client:{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedProject.clientName}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isAdminOrManager && (
                  <button
                    onClick={() => handleDeleteProject(selectedProject._id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Project"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    setActiveStepId(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Project Brief */}
              {selectedProject.description && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Project Brief & Instructions
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedProject.description}
                  </p>
                </div>
              )}

              {/* Steps Progress Timeline Header */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center justify-between">
                  <span>
                    Project Steps Workflow ({selectedProject.steps?.length}{" "}
                    Steps)
                  </span>
                  <span className="text-xs font-bold text-sky-600">
                    {
                      selectedProject.steps?.filter(
                        (s) => s.status === "Approved",
                      ).length
                    }{" "}
                    / {selectedProject.steps?.length} Approved
                  </span>
                </h3>

                {/* Steps List */}
                <div className="space-y-4">
                  {selectedProject.steps?.map((step) => {
                    const isStepActive = activeStepId === step._id;
                    const canSubmit =
                      step.status === "In Progress" ||
                      step.status === "Revision Requested" ||
                      step.status === "Submitted";

                    return (
                      <div
                        key={step._id}
                        className={`rounded-md border transition-all overflow-hidden ${
                          step.status === "Approved"
                            ? "border-emerald-200 bg-emerald-50/10"
                            : step.status === "Submitted"
                              ? "border-amber-300 bg-amber-50/20"
                              : step.status === "Revision Requested"
                                ? "border-rose-200 bg-rose-50/20"
                                : "border-slate-200 bg-white"
                        }`}
                      >
                        {/* Step Card Header */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                step.status === "Approved"
                                  ? "bg-emerald-500 text-white"
                                  : step.status === "Submitted"
                                    ? "bg-amber-400 text-white"
                                    : step.status === "Revision Requested"
                                      ? "bg-rose-500 text-white"
                                      : "bg-sky-600 text-white"
                              }`}
                            >
                              {step.stepNumber}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">
                                {step.title}
                              </h4>
                              {step.instructions && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {step.instructions}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            {/* Status Badge */}
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${
                                step.status === "Approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : step.status === "Submitted"
                                    ? "bg-amber-100 text-amber-800 animate-pulse"
                                    : step.status === "Revision Requested"
                                      ? "bg-rose-100 text-rose-800"
                                      : step.status === "In Progress"
                                        ? "bg-sky-100 text-sky-800"
                                        : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {step.status}
                            </span>

                            {/* Submit Work Button for Graphic Designer */}
                            {canSubmit && (
                              <button
                                onClick={() => {
                                  setActiveStepId(
                                    isStepActive ? null : step._id,
                                  );
                                  setSubmissionNotes("");
                                  setSubmissionLinks("");
                                  setUploadedFiles([]);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                              >
                                {isStepActive
                                  ? "Cancel"
                                  : step.submissions?.length > 0
                                    ? "Submit Update"
                                    : "Submit Work"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Submission Form (when active step selected) */}
                        {isStepActive && (
                          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-4 animate-fade-in">
                            <h5 className="text-xs font-extrabold uppercase tracking-wider text-sky-700">
                              Submit Work Progress for Step {step.stepNumber}
                            </h5>

                            {/* Work Notes */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold uppercase text-slate-500">
                                Work Notes / Brief Explanation
                              </label>
                              <textarea
                                rows={3}
                                value={submissionNotes}
                                onChange={(e) =>
                                  setSubmissionNotes(e.target.value)
                                }
                                placeholder="Describe what you completed, design choices, or revision updates..."
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                              />
                            </div>

                            {/* External Links (Figma / Drive / Canva) */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold uppercase text-slate-500">
                                External Design Links (Figma, Canva, Google
                                Drive)
                              </label>
                              <textarea
                                rows={2}
                                value={submissionLinks}
                                onChange={(e) =>
                                  setSubmissionLinks(e.target.value)
                                }
                                placeholder="Paste URLs (one link per line, e.g. https://figma.com/file/...)"
                                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                              />
                            </div>

                            {/* File Upload Attachments */}
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase text-slate-500">
                                Upload Attachments / Images / PDFs
                              </label>
                              <div className="flex items-center gap-3">
                                <label className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-all flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4 text-slate-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                    />
                                  </svg>
                                  Choose Files
                                  <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                  />
                                </label>
                                {isUploading && (
                                  <span className="text-xs text-sky-600 font-semibold animate-pulse">
                                    Uploading file...
                                  </span>
                                )}
                              </div>

                              {/* Uploaded File Previews */}
                              {uploadedFiles.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                                  {uploadedFiles.map((file, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                                    >
                                      <span className="text-xs font-semibold text-slate-700 truncate">
                                        {file.fileName}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleRemoveUploadedFile(idx)
                                        }
                                        className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Action Submit */}
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => handleSubmitStepWork(step._id)}
                                disabled={isSubmittingWork || isUploading}
                                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 cursor-pointer disabled:opacity-50"
                              >
                                {isSubmittingWork
                                  ? "Submitting Work..."
                                  : "Submit Step Work"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Past Submissions & Review History */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/30 space-y-3">
                          {/* Submissions List */}
                          {step.submissions?.length > 0 ? (
                            <div className="space-y-3">
                              <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                Submissions History
                              </h5>
                              {step.submissions.map((sub, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2"
                                >
                                  <div className="flex items-center justify-between text-slate-500 font-medium">
                                    <span className="font-bold text-slate-800">
                                      Submitted by {sub.submittedByName}
                                    </span>
                                    <span>
                                      {new Date(
                                        sub.submittedAt,
                                      ).toLocaleString()}
                                    </span>
                                  </div>

                                  {sub.notes && (
                                    <p className="text-slate-700 font-medium whitespace-pre-wrap">
                                      {sub.notes}
                                    </p>
                                  )}

                                  {/* External Links */}
                                  {sub.links?.length > 0 && (
                                    <div className="space-y-1 pt-1">
                                      <span className="text-[10px] font-bold uppercase text-slate-400">
                                        Submitted Links:
                                      </span>
                                      <div className="flex flex-col gap-1">
                                        {sub.links.map((link, lIdx) => (
                                          <a
                                            key={lIdx}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sky-600 hover:underline font-semibold flex items-center gap-1 text-[11px]"
                                          >
                                            🔗 {link}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* File Attachments */}
                                  {sub.attachments?.length > 0 && (
                                    <div className="space-y-1 pt-1">
                                      <span className="text-[10px] font-bold uppercase text-slate-400">
                                        Attachments:
                                      </span>
                                      <div className="flex flex-wrap gap-2">
                                        {sub.attachments.map((att, aIdx) => (
                                          <a
                                            key={aIdx}
                                            href={att.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 font-semibold flex items-center gap-1.5 transition-all text-xs"
                                          >
                                            📎 {att.fileName}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-medium italic">
                              No work progress submitted yet for this step.
                            </p>
                          )}

                          {/* Feedback Log */}
                          {step.feedback?.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-200">
                              <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                Manager Review Comments
                              </h5>
                              {step.feedback.map((fb, fIdx) => (
                                <div
                                  key={fIdx}
                                  className={`p-3 rounded-xl border text-xs ${
                                    fb.action === "Approved"
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                      : "bg-rose-50 border-rose-200 text-rose-900"
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold mb-1">
                                    <span>
                                      {fb.action === "Approved"
                                        ? "✅ Approved"
                                        : "🔴 Revision Requested"}{" "}
                                      by {fb.reviewedByName}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-normal">
                                      {new Date(fb.reviewedAt).toLocaleString()}
                                    </span>
                                  </div>
                                  {fb.comment && (
                                    <p className="font-medium whitespace-pre-wrap">
                                      {fb.comment}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Admin / Manager Review Buttons */}
                          {isAdminOrManager && step.status === "Submitted" && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                              <h5 className="text-xs font-bold text-amber-900">
                                Admin Review Action Needed
                              </h5>
                              <textarea
                                rows={2}
                                value={reviewComment}
                                onChange={(e) =>
                                  setReviewComment(e.target.value)
                                }
                                placeholder="Review feedback / comments for the designer..."
                                className="w-full p-2.5 bg-white rounded-lg border border-amber-300 text-xs font-medium focus:outline-none"
                              />

                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() =>
                                    handleReviewStepWork(
                                      step._id,
                                      "Revision Requested",
                                    )
                                  }
                                  disabled={isReviewing}
                                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                  Request Revision
                                </button>
                                <button
                                  onClick={() =>
                                    handleReviewStepWork(step._id, "Approved")
                                  }
                                  disabled={isReviewing}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                  Approve Step ✅
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* NEW DESIGN PROJECT MODAL */}
      {/* ======================================================== */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-slate-200">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Create New Design Project
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign graphic design project and configure workflow steps.
                </p>
              </div>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateProjectSubmit}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4"
            >
              {/* Project Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Social Media Banners - Summer Promo"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                />
              </div>

              {/* Client Name & Assigned Designer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">
                    Assign Graphic Designer *
                  </label>
                  <select
                    required
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 bg-white"
                  >
                    <option value="">Select Designer...</option>
                    {users.map((u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.name} ({u.email}) - {u.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 bg-white"
                  />
                </div>
              </div>

              {/* Brief Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">
                  Project Brief & Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed requirements, dimensions, brand guidelines, color codes..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                />
              </div>

              {/* Workflow Template Selector */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold uppercase text-slate-600">
                    Workflow Steps Setup
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Preset:
                    </span>
                    <select
                      value={stepTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="text-xs font-bold text-sky-600 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                    >
                      <option value="standard">Standard (4 Steps)</option>
                      <option value="quick">Quick Task (2 Steps)</option>
                      <option value="branding">
                        Branding Identity (4 Steps)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Steps List Builder */}
                <div className="space-y-2">
                  {customSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2"
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-1">
                        {idx + 1}
                      </span>
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          required
                          placeholder={`Step ${idx + 1} Title`}
                          value={step.title}
                          onChange={(e) =>
                            handleStepChange(idx, "title", e.target.value)
                          }
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Instructions for designer (optional)"
                          value={step.instructions}
                          onChange={(e) =>
                            handleStepChange(
                              idx,
                              "instructions",
                              e.target.value,
                            )
                          }
                          className="w-full h-7 px-2.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-600 bg-white"
                        />
                      </div>
                      {customSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomStep(idx)}
                          className="text-rose-500 hover:text-rose-700 font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddCustomStep}
                    className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                  >
                    + Add Step
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? "Creating Project..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
