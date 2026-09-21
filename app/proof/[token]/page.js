"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { API_BASE_URL } from "../../../lib/apiConfig";

export default function PublicProofPortal() {
  const params = useParams();
  const token = params?.token;

  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Zoom and Pan
  const [zoomLevel, setZoomLevel] = useState(1);

  // Pin Comments
  const [isPinMode, setIsPinMode] = useState(false);
  const [pins, setPins] = useState([]);
  const [activePinDraft, setActivePinDraft] = useState(null);
  const [draftComment, setDraftComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const imageContainerRef = useRef(null);

  // Revision Modal
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Approval Modal
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [clientSignName, setClientSignName] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchProof();
  }, [token]);

  const fetchProof = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/proofs/public/${token}`);
      const data = await res.json();
      if (data.success) {
        setProof(data.proof);
        setPins(data.proof.pinComments || []);
      } else {
        setError(data.error || "Proof not found or link has expired.");
      }
    } catch (err) {
      setError("Unable to connect to proofing server.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (e) => {
    if (!isPinMode || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const xNorm = (e.clientX - rect.left) / rect.width;
    const yNorm = (e.clientY - rect.top) / rect.height;

    if (xNorm >= 0 && xNorm <= 1 && yNorm >= 0 && yNorm <= 1) {
      setActivePinDraft({ xNormalized: xNorm, yNormalized: yNorm, pageIndex: 0 });
    }
  };

  const handleSavePin = () => {
    if (!draftComment.trim() || !activePinDraft) return;
    const newPin = {
      ...activePinDraft,
      comment: draftComment.trim(),
      authorName: authorName.trim() || "Client",
      createdAt: new Date().toISOString(),
    };
    setPins((prev) => [...prev, newPin]);
    setActivePinDraft(null);
    setDraftComment("");
    setIsPinMode(false);
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/proofs/public/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: clientSignName || "Client" }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Proof Approved! Thank you. Your artwork has been verified and approved for production.");
        setIsApproveModalOpen(false);
        fetchProof();
      } else {
        setError(data.error || "Failed to approve proof.");
      }
    } catch (err) {
      setError("Network error while submitting approval.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionReason.trim()) {
      setError("Please provide a reason for the revision request.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/proofs/public/${token}/request-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: revisionReason,
          notes: revisionNotes,
          pinComments: pins,
          requesterName: authorName || "Client",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Revision Request Sent! Our design team will review your comments and upload a revised proof.");
        setIsRevisionModalOpen(false);
        fetchProof();
      } else {
        setError(data.error || "Failed to submit revision.");
      }
    } catch (err) {
      setError("Network error while submitting revision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading digital proof...</p>
        </div>
      </div>
    );
  }

  if (error && !proof) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid or Expired Link</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
        </div>
      </div>
    );
  }

  const isApproved = proof?.approvalStatus === "APPROVED";
  const isRevisionRequested = proof?.approvalStatus === "REVISION_REQUESTED";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            A2V
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-tight">{proof?.company?.name}</h1>
            <p className="text-xs text-slate-400">Digital Proofing Portal • {proof?.projectNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full text-xs font-semibold">
            Version {proof?.versionLabel}
          </span>
          {isApproved ? (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              ✓ Approved
            </span>
          ) : isRevisionRequested ? (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-semibold">
              Revision Requested
            </span>
          ) : (
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs font-semibold">
              Pending Review
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Artwork Viewer Canvas */}
        <div className="flex-1 bg-slate-900 relative flex flex-col items-center justify-center p-4 overflow-auto">
          {/* Controls Bar */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-800/90 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-xl shadow-lg">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              -
            </button>
            <span className="text-xs font-mono text-slate-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
              className="p-1 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              +
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button
              onClick={() => setIsPinMode(!isPinMode)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                isPinMode ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-700 text-slate-200 hover:bg-slate-600"
              }`}
            >
              {isPinMode ? "📍 Click Artwork to Pin" : "📍 Add Pin Comment"}
            </button>
          </div>

          {/* Proof Canvas */}
          <div
            ref={imageContainerRef}
            onClick={handleImageClick}
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
            className={`relative max-w-full max-h-[75vh] transition-transform duration-150 shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white ${
              isPinMode ? "cursor-crosshair ring-2 ring-amber-400" : ""
            }`}
          >
            {proof?.proofUrl ? (
              <img
                src={proof.proofUrl}
                alt="Artwork Proof"
                className="max-h-[70vh] object-contain select-none pointer-events-none"
              />
            ) : (
              <div className="w-[500px] h-[350px] bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
                📄 Proof Preview Document
              </div>
            )}

            {/* Render Pins */}
            {pins.map((pin, idx) => (
              <div
                key={idx}
                style={{ left: `${pin.xNormalized * 100}%`, top: `${pin.yNormalized * 100}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
              >
                <div className="w-6 h-6 bg-amber-500 text-slate-950 rounded-full font-bold text-xs flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-amber-500/50 cursor-pointer">
                  {idx + 1}
                </div>
                <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2 shadow-2xl z-20">
                  <div className="font-semibold text-amber-400">{pin.authorName || "Comment"}:</div>
                  <div className="text-slate-300">{pin.comment}</div>
                </div>
              </div>
            ))}

            {/* Active Pin Draft */}
            {activePinDraft && (
              <div
                style={{ left: `${activePinDraft.xNormalized * 100}%`, top: `${activePinDraft.yNormalized * 100}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-64 bg-slate-900 border-2 border-amber-400 text-white rounded-xl p-3 shadow-2xl"
              >
                <h4 className="text-xs font-bold text-amber-400 mb-1">Add Feedback at Pin</h4>
                <textarea
                  value={draftComment}
                  onChange={(e) => setDraftComment(e.target.value)}
                  placeholder="e.g. Please make logo 20% larger"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white mb-2"
                  rows={2}
                  autoFocus
                />
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => setActivePinDraft(null)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePin}
                    className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    Place Pin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <h2 className="text-sm font-bold text-white mb-3">{proof?.projectTitle}</h2>

            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Product:</span>
                <span className="text-slate-200 font-medium">{proof?.productDescription?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dimensions:</span>
                <span className="text-slate-200 font-medium">
                  {proof?.productDescription?.dimensions?.width} x {proof?.productDescription?.dimensions?.height}{" "}
                  {proof?.productDescription?.dimensions?.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity:</span>
                <span className="text-slate-200 font-medium">{proof?.productDescription?.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Print Sides:</span>
                <span className="text-slate-200 font-medium">{proof?.productDescription?.printSides}</span>
              </div>
            </div>

            {/* Pin Comments List */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Feedback Pins ({pins.length})
              </h3>
              {pins.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No pin comments added yet.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pins.map((pin, i) => (
                    <div key={i} className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2 text-xs flex gap-2">
                      <span className="w-5 h-5 bg-amber-500 text-slate-950 font-bold rounded-full flex items-center justify-center text-[10px] shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-slate-300 flex-1">{pin.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            {successMsg && (
              <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 text-xs mb-2">
                {successMsg}
              </div>
            )}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl p-3 text-xs mb-2">
                {error}
              </div>
            )}

            {!isApproved && (
              <>
                <button
                  onClick={() => setIsApproveModalOpen(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                >
                  ✓ Approve Proof for Production
                </button>
                <button
                  onClick={() => setIsRevisionModalOpen(true)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition"
                >
                  ✏️ Request Revision
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Approval Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Approve Artwork Proof</h3>
            <p className="text-xs text-slate-400 mb-4">
              By approving, you confirm that spelling, layout, dimensions, and visual elements in Version {proof?.versionLabel} are final and verified for print manufacturing.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name (Digital Signature)</label>
              <input
                type="text"
                value={clientSignName}
                onChange={(e) => setClientSignName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                {isSubmitting ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Request Artwork Revision</h3>
            <p className="text-xs text-slate-400 mb-4">
              Describe the specific changes you would like our designers to make on Version {proof?.versionLabel}.
            </p>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Revision Reason *</label>
              <input
                type="text"
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="e.g. Adjust logo placement and fix phone number typo"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Additional Instructions</label>
              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Details or specific notes..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRevision}
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Revision Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
