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
        return ExpenseClaim.objects.filter(status='pending')

class ApproveClaim(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, pk):
        try:
            claim = ExpenseClaim.objects.get(pk=pk, status='pending')
            claim.status = 'approved'
            claim.approved_by = request.user
            claim.save()
            serializer = ExpenseClaimSerializer(claim)
            return Response(serializer.data)
        except ExpenseClaim.DoesNotExist:
            return Response({'error': 'Claim not found or not pending'}, status=status.HTTP_404_NOT_FOUND)

class RejectClaim(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, pk):
        try:
            claim = ExpenseClaim.objects.get(pk=pk, status='pending')
            claim.status = 'rejected'
            claim.save()
            serializer = ExpenseClaimSerializer(claim)
            return Response(serializer.data)
        except ExpenseClaim.DoesNotExist:
            return Response({'error': 'Claim not found or not pending'}, status=status.HTTP_404_NOT_FOUND)

class CategoryListCreate(ListCreateAPIView):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

class CategoryRetrieveUpdateDestroy(RetrieveUpdateDestroyAPIView):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

