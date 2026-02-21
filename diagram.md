```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "owns"
    USERS ||--o{ TASKS : "creates"
    USERS ||--o{ TASKS : "assigned_to"
    USERS ||--o{ COMMENTS : "writes"
    USERS ||--o{ ATTACHMENTS : "uploads"
    USERS ||--o{ ACTIVITY_LOG : "performs"
    USERS ||--o{ PROJECT_MEMBERS : "member_of"
    
    PROJECTS ||--o{ TASKS : "contains"
    PROJECTS ||--o{ PROJECT_MEMBERS : "has"
    
    TASKS ||--o{ COMMENTS : "has"
    TASKS ||--o{ ATTACHMENTS : "has"
    TASKS ||--o{ ACTIVITY_LOG : "tracks"
    TASKS ||--o{ TASK_TAGS : "tagged_with"
    TASKS ||--o{ TASKS : "parent_child"
    
    TAGS ||--o{ TASK_TAGS : "applied_to"

    USERS {
        int user_id PK
        varchar email UK
        varchar password_hash
        varchar first_name
        varchar last_name
        varchar avatar_url
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    PROJECTS {
        int project_id PK
        varchar name
        text description
        int owner_id FK
        varchar color
        boolean is_archived
        timestamp created_at
        timestamp updated_at
    }

    TASKS {
        int task_id PK
        varchar title
        text description
        int project_id FK
        int created_by FK
        int assigned_to FK
        varchar status
        varchar priority
        timestamp due_date
        timestamp completed_at
        decimal estimated_hours
        decimal actual_hours
        int parent_task_id FK
        int position
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    TAGS {
        int tag_id PK
        varchar name UK
        varchar color
        timestamp created_at
    }

    TASK_TAGS {
        int task_id FK
        int tag_id FK
    }

    COMMENTS {
        int comment_id PK
        int task_id FK
        int user_id FK
        text content
        boolean is_edited
        timestamp created_at
        timestamp updated_at
    }

    ATTACHMENTS {
        int attachment_id PK
        int task_id FK
        int uploaded_by FK
        varchar file_name
        varchar file_path
        int file_size
        varchar mime_type
        timestamp created_at
    }

    ACTIVITY_LOG {
        int log_id PK
        int user_id FK
        int task_id FK
        varchar action
        jsonb details
        timestamp created_at
    }

    PROJECT_MEMBERS {
        int project_id FK
        int user_id FK
        varchar role
        timestamp joined_at
    }
 ```