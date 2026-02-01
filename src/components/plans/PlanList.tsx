import { useState } from 'react';
import { usePlans } from '../../hooks/usePlans';
import { useExercises } from '../../hooks/useExercises';
import { PlanCard } from './PlanCard';
import { PlanBuilder } from './PlanBuilder';
import type { PlanFormData } from './PlanBuilder';

export function PlanList() {
  const { plans, activePlans, createPlan, updatePlan, deletePlan, archivePlan, duplicatePlan, isLoading } = usePlans();
  const { exercises } = useExercises();

  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const displayPlans = showArchived ? plans : activePlans;
  const editingPlan = editingPlanId
    ? plans.find(t => t.template_id === editingPlanId)
    : undefined;

  const handleCreate = async (data: PlanFormData) => {
    await createPlan({
      name: data.name,
      exercises: data.exercises.map((e, i) => ({
        ...e,
        order_index: i,
        rest_seconds: e.rest_seconds ?? null,
        replacement_exercise_id: e.replacement_exercise_id ?? null,
      })),
    });
    setView('list');
  };

  const handleUpdate = async (data: PlanFormData) => {
    if (!editingPlanId) return;
    await updatePlan(editingPlanId, {
      name: data.name,
      exercises: data.exercises.map((e, i) => ({
        ...e,
        order_index: i,
        rest_seconds: e.rest_seconds ?? null,
        replacement_exercise_id: e.replacement_exercise_id ?? null,
      })),
    });
    setView('list');
    setEditingPlanId(null);
  };

  const handleDuplicate = async (planId: string) => {
    const plan = plans.find(t => t.template_id === planId);
    if (!plan) return;
    await duplicatePlan(planId, `${plan.name} (Copy)`);
  };

  // Create/Edit form view - renders PlanBuilder component
  if (view === 'create' || view === 'edit') {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-6">
          {view === 'create' ? 'Create Plan' : 'Edit Plan'}
        </h2>
        <PlanBuilder
          exercises={exercises}
          plan={editingPlan}
          onSubmit={view === 'create' ? handleCreate : handleUpdate}
          onCancel={() => { setView('list'); setEditingPlanId(null); }}
        />
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Plans</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-border-secondary"
            />
            Show archived
          </label>
          <button
            onClick={() => setView('create')}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-black text-sm font-medium rounded-xl transition-colors"
          >
            + New Plan
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-text-muted">Loading plans...</div>
      ) : displayPlans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted mb-4">
            {showArchived ? 'No plans yet' : 'No active plans'}
          </p>
          <button
            onClick={() => setView('create')}
            className="text-accent hover:text-accent/80"
          >
            Create your first plan
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayPlans.map(plan => (
            <PlanCard
              key={plan.template_id}
              plan={plan}
              exercises={exercises}
              onEdit={() => { setEditingPlanId(plan.template_id); setView('edit'); }}
              onDuplicate={() => handleDuplicate(plan.template_id)}
              onArchive={(archive) => archivePlan(plan.template_id, archive)}
              onDelete={() => deletePlan(plan.template_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
