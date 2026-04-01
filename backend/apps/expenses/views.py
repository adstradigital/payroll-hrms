from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import ExpenseClaim, ExpenseCategory
from .serializers import ExpenseClaimSerializer, ExpenseCategorySerializer

class SubmitExpenseClaim(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ExpenseClaimSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MyClaimsList(ListAPIView):
    serializer_class = ExpenseClaimSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExpenseClaim.objects.filter(employee=self.request.user)

class PendingApprovals(ListAPIView):
    serializer_class = ExpenseClaimSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        # Admins should see all claims pending any level of approval
        return ExpenseClaim.objects.filter(status='pending').order_by('current_stage', '-created_at')

class ApproveClaim(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, pk):
        try:
            from .services.workflow_service import ClaimWorkflowService
            comments = request.data.get('comments', 'Approved by Admin')
            # Higher-level 'approve' action handles the stage logic
            claim = ClaimWorkflowService.transition_claim(pk, request.user, 'approve', comments)
            serializer = ExpenseClaimSerializer(claim)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_GATEWAY)

class RejectClaim(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, pk):
        try:
            from .services.workflow_service import ClaimWorkflowService
            comments = request.data.get('comments', 'Rejected by Admin')
            claim = ClaimWorkflowService.transition_claim(pk, request.user, 'reject', comments)
            serializer = ExpenseClaimSerializer(claim)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_GATEWAY)

class CategoryListCreate(ListCreateAPIView):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]

class CategoryRetrieveUpdateDestroy(RetrieveUpdateDestroyAPIView):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

