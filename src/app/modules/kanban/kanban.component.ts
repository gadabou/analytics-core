import { Component } from '@angular/core';

interface Task {
  id: string;
  title: string;
  description: string;
  tags: string[];
  progress?: string;
  views?: number;
  comments?: number;
  attachments?: number;
}

@Component({
  standalone: false,
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.scss']
})
export class KanbanComponent {
  columns = [
    { id: 'todo', title: 'To Do', color: '#ff6b6b', tasks: [] as Task[] },
    { id: 'inprogress', title: 'In Progress', color: '#5b8cff', tasks: [] as Task[] },
    { id: 'needreview', title: 'Need Review', color: '#ffb020', tasks: [] as Task[] },
    { id: 'done', title: 'Done', color: '#00c48c', tasks: [] as Task[] },
  ];

  draggedTask: { task?: Task, from?: string } = {};

  constructor() {
    // Seed tasks to match layout in image
    this.columns[0].tasks = [
      { id: 't1', title: 'Wireframing', description: 'Create low-fidelity designs that outline the basic structure and layout of the product or service...', tags: ['UX stages'], progress: '0/8', views: 2, comments: 0, attachments: 0 },
      { id: 't2', title: 'First design concept', description: 'Create a concept based on the research and insights gathered during the discovery phase of the project...', tags: ['Design'], progress: '0/4', views: 1, comments: 0, attachments: 3 },
      { id: 't3', title: 'Design library', description: 'Create a collection of reusable design elements, such as buttons, forms, and navigation menus...', tags: ['Design'], progress: '0/6', views: 0, comments: 0, attachments: 0 }
    ];

    this.columns[1].tasks = [
      { id: 't4', title: 'Customer Journey Mapping', description: 'Identify the key touchpoints and gain points in the customer journey, and to develop strategies to improve the overall customer...', tags: ['UX stages'], progress: '3/10', views: 6, comments: 11, attachments: 7 }
    ];

    this.columns[2].tasks = [
      { id: 't5', title: 'Competitor research', description: 'Research competitors and identify weakness and strengths each of them. Comparing their product features, quality...', tags: ['UX stages'], progress: '7/7', views: 4, comments: 9, attachments: 5 }
    ];

    this.columns[3].tasks = [
      { id: 't6', title: 'Branding, visual identity', description: 'Create a brand identity system that includes a logo, typography, color palette, and brand guidelines...', tags: ['Branding'], progress: '3/3', views: 3, comments: 5, attachments: 8 },
      { id: 't7', title: 'Marketing materials', description: 'Create a branded materials such as business cards, flyers, brochures, and social media graphics...', tags: ['Branding'], progress: '5/5', views: 2, comments: 7, attachments: 8 }
    ];
  }

  onDragStart(ev: DragEvent, task: Task, colId: string) {
    this.draggedTask = { task, from: colId };
    if (ev.dataTransfer) {
      ev.dataTransfer.setData('text/plain', task.id);
      ev.dataTransfer.effectAllowed = 'move';
    }
  }
  onDragOver(ev: DragEvent) {
    ev.preventDefault();
    ev.dataTransfer!.dropEffect = 'move';
  }
  onDrop(ev: DragEvent, toColId: string) {
    ev.preventDefault();
    const taskId = ev.dataTransfer?.getData('text/plain');
    if (!taskId) return;
    const fromCol = this.columns.find(c => c.id === this.draggedTask.from);
    const toCol = this.columns.find(c => c.id === toColId);
    if (!fromCol || !toCol || !this.draggedTask.task) return;
    // remove from source
    const idx = fromCol.tasks.findIndex(t => t.id === this.draggedTask.task!.id);
    if (idx > -1) fromCol.tasks.splice(idx, 1);
    // push into destination at end
    toCol.tasks.push(this.draggedTask.task);
    this.draggedTask = {};
  }

  addTask(colId: string) {
    const col = this.columns.find(c => c.id === colId);
    if (!col) return;
    const newTask: Task = {
      id: 't' + Math.random().toString(36).slice(2, 7),
      title: 'New Task',
      description: 'Description...',
      tags: ['UX stage'],
      progress: '0/0',
      views: 0, comments: 0, attachments: 0
    };
    col.tasks.unshift(newTask);
  }

  trackById(i: number, t: Task) { return t.id; }
}
