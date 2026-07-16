import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Globe, Plus, Trash2, ExternalLink, Folder, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePortfolio, useUpdatePortfolio } from '@/api/hooks'

export default function PortfolioPage() {
  const { data: portfolioData, isLoading } = usePortfolio()
  const updateMutation = useUpdatePortfolio()

  const portfolio = portfolioData?.portfolio
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [description, setDescription] = useState('')
  const [projects, setProjects] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', url: '', technologies: '' })

  useEffect(() => {
    if (portfolio) {
      setPortfolioUrl(portfolio.url || '')
      setDescription(portfolio.description || '')
      setProjects(portfolio.projects || [])
    }
  }, [portfolio])

  const handleAddProject = () => {
    if (!newProject.name) return toast.error('Le nom du projet est requis')
    const project = {
      name: newProject.name,
      description: newProject.description,
      url: newProject.url,
      technologies: newProject.technologies.split(',').map(t => t.trim()).filter(Boolean),
    }
    setProjects([...projects, project])
    setNewProject({ name: '', description: '', url: '', technologies: '' })
    setShowAddForm(false)
  }

  const handleRemoveProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    updateMutation.mutate(
      { url: portfolioUrl, description, projects },
      {
        onSuccess: () => toast.success('Portfolio sauvegardé !'),
        onError: () => toast.error('Erreur lors de la sauvegarde'),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
        <div className="flex items-center gap-4">
          <Link to="/profile" className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition">
            <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-800 dark:text-white">Mon Portfolio</h1>
            <p className="text-surface-500">Chargement...</p>
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-surface-200 dark:bg-surface-700" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/profile" className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition">
          <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-surface-800 dark:text-white">Mon Portfolio</h1>
          <p className="text-surface-500">Présentez vos projets et réalisations</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-800">
        <h2 className="text-lg font-semibold text-surface-800 dark:text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-500" />
          URL du Portfolio
        </h2>
        <input
          type="url"
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          placeholder="https://votre-portfolio.dev"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full mt-4 px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
          placeholder="Décrivez votre portfolio..."
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-800 dark:text-white flex items-center gap-2">
            <Folder className="w-5 h-5 text-accent-500" />
            Projets ({projects.length})
          </h2>
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl space-y-3">
            <input value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nom du projet" />
            <input value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" placeholder="Description" />
            <input value={newProject.url} onChange={e => setNewProject({...newProject, url: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" placeholder="URL du projet" />
            <input value={newProject.technologies} onChange={e => setNewProject({...newProject, technologies: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" placeholder="Technologies (séparées par virgules)" />
            <div className="flex gap-2">
              <button onClick={handleAddProject} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition">Ajouter</button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg text-sm font-medium hover:bg-surface-300 dark:hover:bg-surface-600 transition">Annuler</button>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {projects.length === 0 && (
            <p className="text-center text-surface-400 dark:text-surface-500 py-8">
              Aucun projet ajouté pour le moment.
            </p>
          )}
          {projects.map((project, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-surface-800 dark:text-white">{project.name}</h3>
                <p className="text-sm text-surface-500 mt-1">{project.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(project.technologies || []).map(tech => (
                    <span key={tech} className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full font-medium">{tech}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {project.url && (
                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition">
                    <ExternalLink className="w-4 h-4 text-surface-500" />
                  </a>
                )}
                <button onClick={() => handleRemoveProject(i)} className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-500/10 transition">
                  <Trash2 className="w-4 h-4 text-danger-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition shadow-lg shadow-primary-500/25 flex items-center gap-2 disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : null}
          Sauvegarder le portfolio
        </button>
      </div>
    </div>
  )
}
