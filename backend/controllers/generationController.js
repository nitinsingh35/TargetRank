import ContentImportBatch from '../models/ContentImportBatch.js';
import { runGeneratorJob } from '../services/QuestionGeneratorService.js';

// @desc    Submit background question generator job
// @route   POST /api/generation/generate
// @access  Private/Admin or Mentor
export const createGenerationJob = async (req, res, next) => {
  try {
    const { generatorType, count = 10, examId } = req.body;

    if (!generatorType || !examId) {
      return res.status(400).json({ message: 'Generator type and Exam ID are required.' });
    }

    // Mentor cannot publish directly; all generated questions remain pending_review
    const batch = await ContentImportBatch.create({
      batchName: `${generatorType.toUpperCase()} Generator Job (${new Date().toLocaleDateString('en-IN')})`,
      contentType: 'question_set',
      uploadedBy: req.user._id,
      status: 'queued',
      totalRows: count,
    });

    // Start generator job in background
    runGeneratorJob(batch._id, generatorType, Number(count), examId, req.user._id);

    res.status(202).json({
      message: 'Question generation job successfully queued in background.',
      batch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of all generation batches
// @route   GET /api/generation/batches
// @access  Private/Admin or Mentor
export const getGenerationBatches = async (req, res, next) => {
  try {
    const batches = await ContentImportBatch.find({ contentType: 'question_set' })
      .populate('uploadedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json(batches);
  } catch (error) {
    next(error);
  }
};

// @desc    Get details of a generation batch
// @route   GET /api/generation/batches/:id
// @access  Private/Admin or Mentor
export const getGenerationBatchById = async (req, res, next) => {
  try {
    const batch = await ContentImportBatch.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found.' });
    }

    res.status(200).json(batch);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a generation batch
// @route   DELETE /api/generation/batches/:id
// @access  Private/Admin
export const deleteGenerationBatch = async (req, res, next) => {
  try {
    const batch = await ContentImportBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found.' });
    }

    await batch.deleteOne();
    res.status(200).json({ message: 'Generation batch removed.' });
  } catch (error) {
    next(error);
  }
};
