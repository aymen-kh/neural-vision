import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface ModelRecord {
    id?: number;
    name: string;
    architecture: string;
    accuracy: number;
    createdAt: string;
}

export interface TrainingSession {
    id?: number;
    modelId: number;
    epochs: number;
    accuracy: number;
    loss: number;
    date: string;
}

@Injectable({
    providedIn: 'root',
})
export class ModelHistoryService {
    private apiUrl = 'http://localhost:3001'; // JSON Server URL

    // Signal to track saved models
    readonly savedModels = signal<ModelRecord[]>([]);
    readonly trainingSessions = signal<TrainingSession[]>([]);

    constructor(private http: HttpClient) {
        console.log('[ModelHistoryService] Service initialized');
        this.loadModels();
        this.loadTrainingSessions();
    }

    // Load all saved models
    loadModels(): void {
        console.log('[ModelHistoryService] Loading models from server');
        this.http.get<ModelRecord[]>(`${this.apiUrl}/models`)
            .pipe(
                tap(models => console.log('[ModelHistoryService] Models loaded:', models))
            )
            .subscribe({
                next: (models) => this.savedModels.set(models),
                error: (err) => console.error('[ModelHistoryService] Error loading models:', err)
            });
    }

    // Save a new model
    saveModel(model: ModelRecord): Observable<ModelRecord> {
        console.log('[ModelHistoryService] Saving model:', model);
        return this.http.post<ModelRecord>(`${this.apiUrl}/models`, model)
            .pipe(
                tap(savedModel => {
                    console.log('[ModelHistoryService] Model saved:', savedModel);
                    this.loadModels(); // Refresh list
                })
            );
    }

    // Load training sessions
    loadTrainingSessions(): void {
        console.log('[ModelHistoryService] Loading training sessions from server');
        this.http.get<TrainingSession[]>(`${this.apiUrl}/trainingSessions`)
            .pipe(
                tap(sessions => console.log('[ModelHistoryService] Sessions loaded:', sessions))
            )
            .subscribe({
                next: (sessions) => this.trainingSessions.set(sessions),
                error: (err) => console.error('[ModelHistoryService] Error loading sessions:', err)
            });
    }

    // Save training session
    saveTrainingSession(session: TrainingSession): Observable<TrainingSession> {
        console.log('[ModelHistoryService] Saving training session:', session);
        return this.http.post<TrainingSession>(`${this.apiUrl}/trainingSessions`, session)
            .pipe(
                tap(savedSession => {
                    console.log('[ModelHistoryService] Training session saved:', savedSession);
                    this.loadTrainingSessions(); // Refresh list
                })
            );
    }

    // Get model by ID
    getModel(id: number): Observable<ModelRecord> {
        console.log('[ModelHistoryService] Fetching model with ID:', id);
        return this.http.get<ModelRecord>(`${this.apiUrl}/models/${id}`)
            .pipe(
                tap(model => console.log('[ModelHistoryService] Model fetched:', model))
            );
    }

    // Delete model
    deleteModel(id: number): Observable<void> {
        console.log('[ModelHistoryService] Deleting model with ID:', id);
        return this.http.delete<void>(`${this.apiUrl}/models/${id}`)
            .pipe(
                tap(() => {
                    console.log('[ModelHistoryService] Model deleted');
                    this.loadModels(); // Refresh list
                })
            );
    }

    // Update model
    updateModel(id: number, model: Partial<ModelRecord>): Observable<ModelRecord> {
        console.log('[ModelHistoryService] Updating model with ID:', id, model);
        return this.http.patch<ModelRecord>(`${this.apiUrl}/models/${id}`, model)
            .pipe(
                tap(updatedModel => {
                    console.log('[ModelHistoryService] Model updated:', updatedModel);
                    this.loadModels(); // Refresh list
                })
            );
    }
}
