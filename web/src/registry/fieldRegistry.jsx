import { Type, Hash, Mail, Calendar, List, Star, TextSelect, ToggleLeft, Activity, Upload, CheckSquare, CircleDot, Image } from 'lucide-react';

/* 
  The Field Registry manages rendering logic mapping for the Stage 
  and property configurations for the Builder.
*/

// STUB COMPONENTS - These will be fully formed in src/components/fields/*
import { BasicStageInput, BasicConfig } from '../components/fields/BasicFields';
import { RatingStage, RatingConfig } from '../components/fields/RatingField';
import { LongTextStage, LongTextConfig } from '../components/fields/LongTextField';
import { BinaryStage, BinaryConfig } from '../components/fields/BinaryField';
import { OpinionStage, OpinionConfig } from '../components/fields/OpinionField';
import { DateStage, DateConfig } from '../components/fields/DateField';
import { UploadStage, UploadConfig } from '../components/fields/UploadField';
import { MultipleChoiceStage, MultipleChoiceConfig } from '../components/fields/MultipleChoiceField';
import { CheckboxStage, CheckboxConfig } from '../components/fields/CheckboxField';
import { ImageStage, ImageConfig } from '../components/fields/ImageField';

export const fieldRegistry = {
    // ---------------------------------------------------------
    // Existing "Basic" Fields
    // ---------------------------------------------------------
    text: {
        type: 'text',
        label: 'Short Text',
        icon: <Type size={16} strokeWidth={1.5} />,
        defaultSchema: { placeholder: 'Type your answer...' },
        ConfigComponent: BasicConfig,
        StageComponent: BasicStageInput,
    },
    number: {
        type: 'number',
        label: 'Number',
        icon: <Hash size={16} strokeWidth={1.5} />,
        defaultSchema: { placeholder: 'Enter an amount...' },
        ConfigComponent: BasicConfig,
        StageComponent: BasicStageInput,
    },
    email: {
        type: 'email',
        label: 'Email',
        icon: <Mail size={16} strokeWidth={1.5} />,
        defaultSchema: { placeholder: 'name@example.com' },
        ConfigComponent: BasicConfig,
        StageComponent: BasicStageInput,
    },

    // ---------------------------------------------------------
    // 2A. Rating (Stars / Numbers)
    // ---------------------------------------------------------
    rating: {
        type: 'rating',
        label: 'Rating scale',
        icon: <Star size={16} strokeWidth={1.5} />,
        defaultSchema: { mode: 'stars', max: 5 }, // mode 'stars' or 'nps'
        ConfigComponent: RatingConfig,
        StageComponent: RatingStage,
    },

    // ---------------------------------------------------------
    // 2B. Long Text (Textarea)
    // ---------------------------------------------------------
    longtext: {
        type: 'longtext',
        label: 'Long Text',
        icon: <TextSelect size={16} strokeWidth={1.5} />,
        defaultSchema: { placeholder: 'Take your time...', limit: null },
        ConfigComponent: LongTextConfig,
        StageComponent: LongTextStage,
    },

    // ---------------------------------------------------------
    // 2C. Yes/No (Binary Toggle)
    // ---------------------------------------------------------
    binary: {
        type: 'binary',
        label: 'Yes / No',
        icon: <ToggleLeft size={16} strokeWidth={1.5} />,
        defaultSchema: { leftLabel: 'Yes', rightLabel: 'No' },
        ConfigComponent: BinaryConfig,
        StageComponent: BinaryStage,
    },

    // ---------------------------------------------------------
    // 2D. Opinion Scale (Likert)
    // ---------------------------------------------------------
    opinion: {
        type: 'opinion',
        label: 'Opinion Scale',
        icon: <Activity size={16} strokeWidth={1.5} />,
        defaultSchema: { leftLabel: 'Strongly Disagree', rightLabel: 'Strongly Agree' },
        ConfigComponent: OpinionConfig,
        StageComponent: OpinionStage,
    },

    // ---------------------------------------------------------
    // 2E. Date Picker (Custom popover)
    // ---------------------------------------------------------
    date: {
        type: 'date',
        label: 'Date',
        icon: <Calendar size={16} strokeWidth={1.5} />,
        defaultSchema: { placeholder: 'Select date' },
        ConfigComponent: DateConfig,
        StageComponent: DateStage,
    },

    // ---------------------------------------------------------
    // 2F. File Upload (Dashed dropzone)
    // ---------------------------------------------------------
    upload: {
        type: 'upload',
        label: 'File Upload',
        icon: <Upload size={16} strokeWidth={1.5} />,
        defaultSchema: { acceptedTypes: 'PDF, JPG, PNG' },
        ConfigComponent: UploadConfig,
        StageComponent: UploadStage,
    },

    // ---------------------------------------------------------
    // 2G. Multiple Choice (Radio Single)
    // ---------------------------------------------------------
    choice: {
        type: 'choice',
        label: 'Multiple Choice',
        icon: <CircleDot size={16} strokeWidth={1.5} />,
        defaultSchema: { options: ['Option 1', 'Option 2'] },
        ConfigComponent: MultipleChoiceConfig,
        StageComponent: MultipleChoiceStage,
    },

    // ---------------------------------------------------------
    // 2H. Checkbox (Multi-select)
    // ---------------------------------------------------------
    checkbox: {
        type: 'checkbox',
        label: 'Checkboxes',
        icon: <CheckSquare size={16} strokeWidth={1.5} />,
        defaultSchema: { options: ['Option A', 'Option B'] },
        ConfigComponent: CheckboxConfig,
        StageComponent: CheckboxStage,
    },

    // ---------------------------------------------------------
    // 2I. Image (Static visual block)
    // ---------------------------------------------------------
    image: {
        type: 'image',
        label: 'Image',
        icon: <Image size={16} strokeWidth={1.5} />,
        defaultSchema: { url: '' },
        ConfigComponent: ImageConfig,
        StageComponent: ImageStage,
    }
};

// Map arrays for simple rendering iteration
export const getFieldTypesArray = () => Object.values(fieldRegistry);
