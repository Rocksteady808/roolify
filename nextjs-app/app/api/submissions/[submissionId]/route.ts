import { NextResponse } from 'next/server';
import { xanoSubmissions } from '@/lib/xano';

/**
 * DELETE /api/submissions/[submissionId]
 * Delete a submission by ID
 */
export async function DELETE(
  request: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const submissionId = parseInt(params.submissionId);
    
    if (isNaN(submissionId)) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // Delete from Xano
    await xanoSubmissions.delete(submissionId);

    console.log(`[Submissions API] Deleted submission ${submissionId}`);

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    console.error('[Submissions API] Error deleting submission:', error);
    return NextResponse.json(
      { error: 'Failed to delete submission', details: String(error) },
      { status: 500 }
    );
  }
}








