// ProjectDetails.jsx - REPLACE with clean version:
import React, { useEffect, useState } from "react";
import ProjectCard from "../components/Projects/ProjectCard";
import projectService from "../services/projectService";
import { toast } from "react-toastify";

export default function ProjectDetails() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getProjects();
      setProjects(res.data || []);
    } catch (err) {
      console.error("fetchProjects:", err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      {loading ? (
        <div>Loading projects…</div>
      ) : projects.length === 0 ? (
        <div>No projects yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}